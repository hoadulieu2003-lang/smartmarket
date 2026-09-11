import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env';

const endpoint = env.S3_ENDPOINT.replace(/\/$/, '');
const prefix = env.S3_UPLOAD_PREFIX.replace(/^\/+|\/+$/g, '');

export const s3 = new S3Client({
  endpoint,
  region: env.S3_REGION,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

function encodeObjectKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

export function publicObjectUrl(key: string): string {
  const base = (env.S3_PUBLIC_BASE_URL ?? `${endpoint}/${env.S3_BUCKET}`).replace(/\/$/, '');
  return `${base}/${encodeObjectKey(key)}`;
}

export function uploadObjectKey(relativeKey: string): string {
  const clean = relativeKey.replace(/^\/+/, '');
  return prefix ? `${prefix}/${clean}` : clean;
}

export async function putPublicImage(input: {
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      ContentDisposition: 'inline',
    }),
  );
  return publicObjectUrl(input.key);
}
