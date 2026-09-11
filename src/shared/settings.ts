import { prisma } from './prisma';

const cache = new Map<string, { value: unknown; ts: number }>();
const TTL_MS = 30_000;

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.value as T;
  const row = await prisma.app_settings.findUnique({ where: { key } });
  const value = (row?.value as T) ?? fallback;
  cache.set(key, { value, ts: Date.now() });
  return value;
}

export function invalidateSetting(key?: string) {
  if (key) cache.delete(key);
  else cache.clear();
}

export const SETTING_KEYS = {
  expiryWarningDays: 'contract_expiry_warning_days',
  defaultDurationMonths: 'contract_default_duration_months',
  rejectionReasons: 'rejection_reasons',
  productUnits: 'product_units',
  reviewRequirePurchase: 'review_require_purchase',
  notificationTemplates: 'notification_templates',
} as const;
