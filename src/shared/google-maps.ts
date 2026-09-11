import axios from 'axios';
import { AppError } from './errors';

export type Coordinates = { latitude: number; longitude: number };

const DIRECT_HOSTS = new Set(['google.com', 'www.google.com', 'maps.google.com']);
const SHORT_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl']);

function invalid(message: string) {
  return new AppError(400, 'GOOGLE_MAPS_URL_INVALID', message);
}

function normalizeHost(hostname: string) {
  return hostname.toLowerCase().replace(/\.$/, '');
}

function assertAllowedUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw invalid('Link Google Maps không hợp lệ');
  }
  if (url.protocol !== 'https:') throw invalid('Link Google Maps phải dùng HTTPS');
  const host = normalizeHost(url.hostname);
  if (!DIRECT_HOSTS.has(host) && !SHORT_HOSTS.has(host))
    throw invalid('Chỉ chấp nhận link từ Google Maps');
  if (host === 'goo.gl' && !url.pathname.toLowerCase().startsWith('/maps'))
    throw invalid('Link goo.gl không thuộc Google Maps');
  return url;
}

function validCoordinates(latitude: number, longitude: number): Coordinates | null {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return null;
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

export function parseGoogleMapsCoordinates(value: string): Coordinates | null {
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  const exact = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i);
  if (exact) {
    const coordinates = validCoordinates(Number(exact[1]), Number(exact[2]));
    if (coordinates) return coordinates;
  }

  const viewport = decoded.match(/\/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|\/|$)/i);
  if (viewport) {
    const coordinates = validCoordinates(Number(viewport[1]), Number(viewport[2]));
    if (coordinates) return coordinates;
  }

  try {
    const url = new URL(value);
    for (const key of ['q', 'query', 'll']) {
      const pair = url.searchParams.get(key)?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (!pair) continue;
      const coordinates = validCoordinates(Number(pair[1]), Number(pair[2]));
      if (coordinates) return coordinates;
    }
  } catch {
    return null;
  }
  return null;
}

async function followGoogleRedirects(initial: URL): Promise<URL> {
  let current = initial;
  for (let hop = 0; hop < 3; hop += 1) {
    const response = await axios.get(current.toString(), {
      maxRedirects: 0,
      timeout: 5000,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 400,
      maxContentLength: 256_000,
      headers: { 'user-agent': 'SmartMarket/1.0' },
    });
    if (response.status < 300) return current;
    const location = response.headers.location;
    if (!location) throw invalid('Link Google Maps rút gọn không có địa chỉ chuyển tiếp');
    current = assertAllowedUrl(new URL(location, current).toString());
    const parsed = parseGoogleMapsCoordinates(current.toString());
    if (parsed) return current;
  }
  throw invalid('Link Google Maps chuyển tiếp quá nhiều lần');
}

export async function resolveGoogleMapsUrl(value: string): Promise<{ url: string } & Coordinates> {
  const initial = assertAllowedUrl(value);
  let coordinates = parseGoogleMapsCoordinates(initial.toString());
  let resolved = initial;
  if (!coordinates && SHORT_HOSTS.has(normalizeHost(initial.hostname))) {
    try {
      resolved = await followGoogleRedirects(initial);
      coordinates = parseGoogleMapsCoordinates(resolved.toString());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(502, 'GOOGLE_MAPS_RESOLVE_FAILED', 'Không thể mở link Google Maps rút gọn');
    }
  }
  if (!coordinates)
    throw new AppError(400, 'GOOGLE_MAPS_COORDINATES_NOT_FOUND', 'Không tìm thấy tọa độ trong link Google Maps');
  return { url: value.trim(), ...coordinates };
}
