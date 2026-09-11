import bcrypt from 'bcryptjs';
import type { users } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { forbidden, unauthorized, badRequest, notFound, conflict } from '../../shared/errors';
import { assertZaloIdentity, decodeZaloPhone, verifyZaloToken } from '../../shared/zalo.client';
import { env } from '../../config/env';
import { signTokens, invalidateUserCache } from '../../middlewares/auth.middleware';

export async function zaloLogin(
  accessToken: string,
  userInfo?: { id: string; name?: string; avatar?: string },
) {
  const profile = await verifyZaloToken(accessToken);
  if (userInfo && userInfo.id !== profile.zaloId)
    throw unauthorized('AUTH_ZALO_PROFILE_MISMATCH', 'Thông tin Zalo không khớp access token');
  const profileName = userInfo?.name?.trim() || profile.name || null;
  const profileAvatar = userInfo?.avatar?.trim() || profile.avatar;
  let user = await prisma.users.findUnique({ where: { zalo_id: profile.zaloId } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        zalo_id: profile.zaloId,
        full_name: profileName || 'Người dùng Zalo',
        avatar: profileAvatar,
        role: 'user',
        status: 'active',
      },
    });
  } else if ((profileName && user.full_name !== profileName) || (profileAvatar && user.avatar !== profileAvatar)) {
    user = await prisma.users.update({
      where: { id: user.id },
      data: {
        ...(profileName ? { full_name: profileName } : {}),
        ...(profileAvatar ? { avatar: profileAvatar } : {}),
      },
    });
  }
  if (user.status !== 'active') throw forbidden('AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
  invalidateUserCache(user.id);
  return { tokens: signTokens(user), me: await buildMePayload(user) };
}

export async function cmsLogin(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim();
  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { email: normalizedIdentifier.toLowerCase() },
        { phone: normalizedIdentifier },
        { username: normalizedIdentifier.toLowerCase() },
      ],
    },
  });
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash)))
    throw unauthorized('AUTH_INVALID_CREDENTIALS', 'Tài khoản hoặc mật khẩu không chính xác');
  if (user.status !== 'active') throw forbidden('AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
  if (user.role === 'user')
    throw forbidden('AUTH_NOT_CMS_ACCOUNT', 'Tài khoản không có quyền truy cập hệ thống quản lý');
  return { tokens: signTokens(user), me: await buildMePayload(user) };
}

/** Web buyer login. Deliberately separate from CMS login so role=user cannot
 * accidentally gain access through the administration authentication path. */
export async function webLogin(identifier: string, password: string) {
  const normalized = identifier.trim();
  const user = await prisma.users.findFirst({
    where: {
      role: 'user',
      OR: [
        { phone: normalized },
        { email: normalized.toLowerCase() },
      ],
    },
  });
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash)))
    throw unauthorized('AUTH_INVALID_CREDENTIALS', 'Tài khoản hoặc mật khẩu không chính xác');
  if (user.status !== 'active') throw forbidden('AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
  invalidateUserCache(user.id);
  return { tokens: signTokens(user), me: await buildMePayload(user) };
}

/** Password registration for a buyer test/production Web flow. */
export async function webRegister(fullName: string, phone: string, password: string) {
  const normalizedPhone = phone.trim();
  const duplicate = await prisma.users.findFirst({
    where: { OR: [{ phone: normalizedPhone }, { email: normalizedPhone.toLowerCase() }] },
    select: { id: true },
  });
  if (duplicate) throw conflict('PHONE_ALREADY_IN_USE', 'Số điện thoại đã được sử dụng');
  const user = await prisma.users.create({
    data: {
      full_name: fullName.trim(),
      phone: normalizedPhone,
      password_hash: await bcrypt.hash(password, 10),
      role: 'user',
      status: 'active',
      merchant_status: 'inactive',
    },
  });
  invalidateUserCache(user.id);
  return { tokens: signTokens(user), me: await buildMePayload(user) };
}

export async function refreshTokens(userId: string) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized('AUTH_TOKEN_INVALID', 'Tài khoản không tồn tại');
  if (user.status !== 'active') throw forbidden('AUTH_ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
  return signTokens(user);
}

/** Payload /auth/me dùng chung cho app và CMS. */
export async function buildMePayload(user: users) {
  const base = {
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar: user.avatar,
      phone: user.phone,
      email: user.email,
      gender: user.gender,
      role: user.role,
      bank_name: user.bank_name,
      bank_code: user.bank_code,
      bank_account_number: user.bank_account_number,
      bank_account_holder: user.bank_account_holder,
    },
  };

  if (user.role === 'user') {
    const [application, contract, selectedMarket] = await Promise.all([
      prisma.merchant_applications.findFirst({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        select: { id: true, status: true, market_id: true, admin_note: true },
      }),
      user.merchant_status === 'active'
        ? prisma.contracts.findFirst({
            where: { merchant_id: user.id, ended_at: null },
            include: { stalls: { include: { markets: { select: { id: true, name: true } } } } },
          })
        : null,
      user.selected_market_id
        ? prisma.markets.findUnique({
            where: { id: user.selected_market_id },
            select: { id: true, name: true, status: true },
          })
        : null,
    ]);
    return {
      ...base,
      is_merchant: user.merchant_status === 'active',
      merchant_status: user.merchant_status,
      merchant_application: application,
      seller: contract
        ? {
            stall_id: contract.stall_id,
            stall_code: contract.stalls.code,
            stall_name: contract.stalls.name,
            market_id: contract.stalls.markets.id,
            market_name: contract.stalls.markets.name,
          }
        : null,
      selected_market:
        selectedMarket && selectedMarket.status === 'active'
          ? { id: selectedMarket.id, name: selectedMarket.name }
          : null,
    };
  }

  // CMS scope
  if (user.role === 'super_admin') return { ...base, scope: { all: true } };
  if (user.role === 'province_admin') {
    const province = user.province_id
      ? await prisma.provinces.findUnique({
          where: { id: user.province_id },
          select: { id: true, name: true },
        })
      : null;
    return { ...base, scope: { province } };
  }
  const markets = await prisma.market_managers.findMany({
    where: { user_id: user.id },
    include: { markets: { select: { id: true, name: true } } },
  });
  return { ...base, scope: { markets: markets.map((m) => m.markets) } };
}

export async function changePassword(user: users, oldPassword: string, newPassword: string) {
  if (!user.password_hash || !(await bcrypt.compare(oldPassword, user.password_hash)))
    throw badRequest('Mật khẩu hiện tại không đúng');
  await prisma.users.update({
    where: { id: user.id },
    data: { password_hash: await bcrypt.hash(newPassword, 10) },
  });
  invalidateUserCache(user.id);
}

export async function updateProfile(
  user: users,
  data: {
    fullName?: string;
    avatar?: string;
    gender?: number;
    bankName?: string;
    bankCode?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
  },
) {
  const updated = await prisma.users.update({
    where: { id: user.id },
    data: {
      full_name: data.fullName,
      avatar: data.avatar,
      gender: data.gender,
      bank_name: data.bankName,
      bank_code: data.bankCode,
      bank_account_number: data.bankAccountNumber,
      bank_account_holder: data.bankAccountHolder,
    },
  });
  invalidateUserCache(user.id);
  return buildMePayload(updated);
}

export async function updateZaloContact(
  user: users,
  input: {
    phoneToken?: string;
    accessToken?: string;
    mockPhone?: string;
    userInfo?: { id: string; name: string; avatar?: string };
  },
) {
  let phone: string;
  let zaloProfile: { name: string; avatar: string | null } | null = null;
  if (input.mockPhone) {
    if (!env.ZALO_MOCK)
      throw forbidden('ZALO_MOCK_DISABLED', 'Không cho phép cập nhật số điện thoại mock');
    phone = input.mockPhone.trim();
    if (!/^0\d{9}$/.test(phone)) throw badRequest('Số điện thoại mock không hợp lệ');
  } else {
    if (!input.phoneToken || !input.accessToken || !input.userInfo)
      throw badRequest('Thiếu token hoặc thông tin người dùng Zalo');
    const profile = await assertZaloIdentity(input.accessToken, user.zalo_id);
    if (input.userInfo.id !== profile.zaloId)
      throw unauthorized('ZALO_PROFILE_MISMATCH', 'Thông tin Zalo không khớp phiên đang đăng nhập');
    phone = await decodeZaloPhone(input.accessToken, input.phoneToken);
    zaloProfile = {
      name: input.userInfo.name.trim(),
      avatar: input.userInfo.avatar?.trim() || profile.avatar,
    };
  }

  const duplicate = await prisma.users.findFirst({ where: { phone, id: { not: user.id } }, select: { id: true } });
  if (duplicate) throw conflict('PHONE_ALREADY_IN_USE', 'Số điện thoại đã được liên kết với tài khoản khác');
  const updated = await prisma.users.update({
    where: { id: user.id },
    data: {
      phone,
      ...(zaloProfile ? { full_name: zaloProfile.name, avatar: zaloProfile.avatar } : {}),
    },
  });
  invalidateUserCache(user.id);
  return buildMePayload(updated);
}

export async function setSelectedMarket(user: users, marketId: string) {
  const market = await prisma.markets.findUnique({ where: { id: marketId } });
  if (!market || market.status !== 'active') throw notFound('Chợ không tồn tại hoặc đã ngừng hoạt động');
  await prisma.users.update({ where: { id: user.id }, data: { selected_market_id: marketId } });
  invalidateUserCache(user.id);
  return { id: market.id, name: market.name };
}
