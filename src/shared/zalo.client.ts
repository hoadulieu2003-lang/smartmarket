import axios from 'axios';
import { env } from '../config/env';
import { serviceUnavailable, unauthorized, upstreamError } from './errors';

export type ZaloProfile = { zaloId: string; name: string | null; avatar: string | null };
export type ZaloLocation = {
  provider: string | null;
  latitude: number;
  longitude: number;
  timestamp: number | null;
};

type ZaloInfoResponse = {
  data?: Record<string, unknown>;
  error?: number;
  message?: string;
};

const GRAPH_URL = 'https://graph.zalo.me/v2.0';

/**
 * Verify access token với Zalo Open API và lấy profile.
 * Dev/test: ZALO_MOCK=true cho phép token dạng "mock:<zaloId>:<tên>" để chạy không cần Zalo thật.
 */
export async function verifyZaloToken(accessToken: string): Promise<ZaloProfile> {
  if (env.ZALO_MOCK && accessToken.startsWith('mock:')) {
    const [, zaloId, ...nameParts] = accessToken.split(':');
    if (!zaloId) throw unauthorized('AUTH_ZALO_TOKEN_INVALID', 'Token Zalo không hợp lệ');
    return { zaloId, name: nameParts.join(':') || `Người dùng ${zaloId}`, avatar: null };
  }
  try {
    const { data } = await axios.get(`${GRAPH_URL}/me`, {
      headers: { access_token: accessToken },
      params: { fields: 'id,name,picture' },
      timeout: 8000,
    });
    if (!data?.id) throw new Error('no id');
    return {
      zaloId: String(data.id),
      name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : null,
      avatar: data.picture?.data?.url ?? null,
    };
  } catch {
    throw unauthorized('AUTH_ZALO_TOKEN_INVALID', 'Không xác thực được với Zalo, vui lòng thử lại');
  }
}

export async function assertZaloIdentity(accessToken: string, expectedZaloId: string | null) {
  if (!expectedZaloId)
    throw unauthorized('AUTH_ZALO_ACCOUNT_REQUIRED', 'Tài khoản hiện tại chưa liên kết Zalo');
  const profile = await verifyZaloToken(accessToken);
  if (profile.zaloId !== expectedZaloId)
    throw unauthorized('ZALO_ACCESS_TOKEN_MISMATCH', 'Phiên Zalo không thuộc tài khoản đang đăng nhập');
  return profile;
}

async function decodeZaloInfo(accessToken: string, code: string): Promise<Record<string, unknown>> {
  if (!env.ZALO_APP_SECRET)
    throw serviceUnavailable('ZALO_NOT_CONFIGURED', 'Máy chủ chưa cấu hình Zalo App Secret');
  try {
    const response = await axios.get<ZaloInfoResponse>(`${GRAPH_URL}/me/info`, {
      headers: {
        access_token: accessToken,
        code,
        secret_key: env.ZALO_APP_SECRET,
      },
      timeout: 8000,
      validateStatus: () => true,
    });
    const payload = response.data;
    if (response.status < 200 || response.status >= 300 || payload?.error !== 0 || !payload?.data) {
      throw upstreamError(
        'ZALO_TOKEN_INVALID',
        payload?.message || 'Token Zalo không hợp lệ, đã hết hạn hoặc đã được sử dụng',
        { zaloError: payload?.error ?? null },
      );
    }
    return payload.data;
  } catch (error) {
    if (error instanceof Error && 'status' in error) throw error;
    if (axios.isAxiosError(error))
      throw upstreamError('ZALO_SERVICE_UNAVAILABLE', 'Không kết nối được dịch vụ Zalo, vui lòng thử lại');
    throw error;
  }
}

export async function decodeZaloPhone(accessToken: string, code: string): Promise<string> {
  const data = await decodeZaloInfo(accessToken, code);
  const raw = typeof data.number === 'string' ? data.number.trim() : '';
  const phone = raw.replace(/^\+?84/, '0');
  if (!/^0\d{9}$/.test(phone))
    throw upstreamError('ZALO_PHONE_RESPONSE_INVALID', 'Zalo không trả về số điện thoại hợp lệ');
  return phone;
}

export async function decodeZaloLocation(accessToken: string, code: string): Promise<ZaloLocation> {
  const data = await decodeZaloInfo(accessToken, code);
  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw upstreamError('ZALO_LOCATION_RESPONSE_INVALID', 'Zalo không trả về vị trí hợp lệ');
  }
  const timestampValue = Number(data.timestamp);
  return {
    provider: typeof data.provider === 'string' ? data.provider : null,
    latitude,
    longitude,
    timestamp: Number.isFinite(timestampValue) ? timestampValue : null,
  };
}
