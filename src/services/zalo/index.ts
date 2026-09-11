import { apiPost } from '@/services/api';
import { useAuth } from '@/stores';
import type { LoginResponse, Market, MePayload, SessionUser } from '@/types';

const DEV_MOCK_DEFAULT = 'mock:zalo-dev-buyer:Khách Mua Thử';
let contactRequest: Promise<SessionUser> | null = null;

export function isZaloRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const runtime = String(import.meta.env.VITE_APP_RUNTIME ?? 'auto').toLowerCase();
  if (runtime === 'browser') return false;
  if (runtime === 'zalo') return true;
  const hostname = window.location.hostname.toLowerCase();
  const zaloHost = hostname === 'h5.zdn.vn' || hostname.endsWith('.h5.zdn.vn');
  const zaloWebView = typeof navigator !== 'undefined' && /zalo/i.test(navigator.userAgent);
  return zaloHost || zaloWebView;
}

export function getDevMockToken(): string {
  try {
    return localStorage.getItem('sm-dev-zalo') || DEV_MOCK_DEFAULT;
  } catch {
    return DEV_MOCK_DEFAULT;
  }
}

export const DEV_ACCOUNTS: { label: string; token: string }[] = [
  { label: 'Khách mua (mới)', token: 'mock:zalo-dev-buyer:Khách Mua Thử' },
  { label: 'Tiểu thương Rau Sạch (seller)', token: 'mock:zalo-merchant-1:Tiểu thương Rau Sạch' },
  { label: 'Người xin làm tiểu thương', token: 'mock:zalo-applicant-1:Người Xin Làm Tiểu Thương' },
];

function zmpErrorMessage(error: unknown, fallback: string): Error {
  const value = error as { code?: number; message?: string };
  if (value?.code === -201 || value?.code === -1401 || value?.code === -2002 || value?.code === -2003)
    return new Error('Bạn đã từ chối cấp quyền trên Zalo');
  return new Error(value?.message || fallback);
}

async function getZmp(): Promise<any> {
  try {
    return await import('zmp-sdk');
  } catch (error) {
    throw zmpErrorMessage(error, 'Không tải được Zalo Mini App SDK');
  }
}

export async function getZaloAccessToken(): Promise<string> {
  if (!isZaloRuntime()) return getDevMockToken();
  const zmp = await getZmp();
  if (typeof zmp.getAccessToken !== 'function') throw new Error('Zalo SDK không hỗ trợ getAccessToken');
  try {
    const token = await zmp.getAccessToken({});
    if (!token) throw new Error('Zalo không trả về access token');
    return String(token);
  } catch (error) {
    throw zmpErrorMessage(error, 'Không lấy được phiên đăng nhập Zalo');
  }
}

async function getGrantedUserInfo(): Promise<{ id: string; name?: string; avatar?: string } | undefined> {
  if (!isZaloRuntime()) return undefined;
  const zmp = await getZmp();
  if (typeof zmp.getSetting !== 'function' || typeof zmp.getUserInfo !== 'function') return undefined;
  try {
    const { authSetting } = await zmp.getSetting({});
    if (authSetting?.['scope.userInfo'] !== true) return undefined;
    const { userInfo } = await zmp.getUserInfo({ avatarType: 'large' });
    if (!userInfo?.id) return undefined;
    return { id: userInfo.id, name: userInfo.name, avatar: userInfo.avatar };
  } catch {
    return undefined;
  }
}

export async function zaloLogin(overrideToken?: string): Promise<LoginResponse> {
  const accessToken = overrideToken ?? (await getZaloAccessToken());
  const userInfo = !overrideToken && isZaloRuntime()
    ? await getGrantedUserInfo()
    : undefined;
  return apiPost<LoginResponse>('/auth/zalo-login', { accessToken, userInfo });
}

async function requestZaloContact(): Promise<SessionUser> {
  if (!isZaloRuntime()) {
    const input = typeof window !== 'undefined'
      ? window.prompt('Nhập số điện thoại dev (backend chỉ nhận khi ZALO_MOCK=true)')
      : null;
    const mockPhone = input?.trim() ?? '';
    if (!/^0\d{9}$/.test(mockPhone)) throw new Error('Số điện thoại dev không hợp lệ');
    const me = await apiPost<MePayload>('/users/me/zalo-phone', { mockPhone });
    useAuth.getState().setMe(me);
    return me.user;
  }

  const zmp = await getZmp();
  if (typeof zmp.authorize !== 'function') throw new Error('Zalo SDK không hỗ trợ xin quyền người dùng');
  if (typeof zmp.getUserInfo !== 'function') throw new Error('Zalo SDK không hỗ trợ lấy thông tin người dùng');
  if (typeof zmp.getPhoneNumber !== 'function') throw new Error('Zalo SDK không hỗ trợ lấy số điện thoại');
  try {
    const permissions = await zmp.authorize({
      scopes: ['scope.userInfo', 'scope.userPhonenumber'],
    });
    if (permissions?.['scope.userInfo'] !== true || permissions?.['scope.userPhonenumber'] !== true)
      throw new Error('Bạn cần cho phép truy cập thông tin và số điện thoại Zalo để tiếp tục');

    const [{ userInfo }, phoneResult, accessToken] = await Promise.all([
      zmp.getUserInfo({ avatarType: 'large' }),
      zmp.getPhoneNumber({}),
      getZaloAccessToken(),
    ]);
    if (!userInfo?.id || !userInfo.name?.trim())
      throw new Error('Zalo không trả về đầy đủ thông tin người dùng');
    const phoneToken = phoneResult?.token;
    if (!phoneToken) throw new Error('Zalo không trả về token số điện thoại');
    const me = await apiPost<MePayload>('/users/me/zalo-phone', {
      phoneToken,
      accessToken,
      userInfo: {
        id: String(userInfo.id),
        name: String(userInfo.name).trim(),
        avatar: userInfo.avatar || undefined,
      },
    });
    useAuth.getState().setMe(me);
    return me.user;
  } catch (error) {
    throw zmpErrorMessage(error, 'Không lấy được thông tin và số điện thoại từ Zalo');
  }
}

export function ensureZaloContact(options: { force?: boolean } = {}): Promise<SessionUser> {
  const current = useAuth.getState().user;
  if (!options.force && current?.phone) return Promise.resolve(current);
  if (contactRequest) return contactRequest;
  contactRequest = requestZaloContact().finally(() => {
    contactRequest = null;
  });
  return contactRequest;
}

function browserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Trình duyệt không hỗ trợ định vị'));
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }),
      () => reject(new Error('Không lấy được vị trí — bạn có thể tìm chợ theo tên')),
      { timeout: 8000, enableHighAccuracy: true },
    );
  });
}

export async function getNearbyMarketsFromRuntime(limit = 10): Promise<Market[]> {
  if (!isZaloRuntime()) {
    const location = await browserLocation();
    return apiPost<Market[]>('/markets/nearby', { ...location, limit });
  }

  const zmp = await getZmp();
  if (typeof zmp.getLocation !== 'function') throw new Error('Zalo SDK không hỗ trợ lấy vị trí');
  try {
    const result = await zmp.getLocation({});
    const locationToken = result?.token;
    if (!locationToken) throw new Error('Zalo không trả về token vị trí');
    const accessToken = await getZaloAccessToken();
    return apiPost<Market[]>('/markets/nearby/zalo', { locationToken, accessToken, limit });
  } catch (error) {
    throw zmpErrorMessage(error, 'Không lấy được vị trí từ Zalo');
  }
}
