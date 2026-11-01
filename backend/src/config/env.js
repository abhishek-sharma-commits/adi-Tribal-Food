import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  CLIENT_ORIGIN: z.string().min(1),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  // Comma-separated https URL prefixes that uploaded media must live under (ImageKit/Cloudinary account URL).
  MEDIA_URL_PREFIX: z
    .string()
    .optional()
    .refine((v) => !v || v.split(',').every((p) => p.trim().startsWith('https://')), 'MEDIA_URL_PREFIX entries must start with https://'),
  IMAGEKIT_PUBLIC_KEY: z.string().trim().optional(),
  IMAGEKIT_PRIVATE_KEY: z.string().trim().optional(),
  IMAGEKIT_URL_ENDPOINT: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.startsWith('https://'), 'IMAGEKIT_URL_ENDPOINT must start with https://'),
  MEDIA_MAX_IMAGE_MB: z.coerce.number().positive().default(10),
  MEDIA_MAX_VIDEO_MB: z.coerce.number().positive().default(100),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const data = parsed.data;

export const env = {
  ...data,
  isProd: data.NODE_ENV === 'production',
  mediaUrlPrefixes: [data.MEDIA_URL_PREFIX, data.IMAGEKIT_URL_ENDPOINT].filter(Boolean).join(',')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.endsWith('/') ? p : `${p}/`)),
  imagekit: {
    publicKey: data.IMAGEKIT_PUBLIC_KEY,
    privateKey: data.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: data.IMAGEKIT_URL_ENDPOINT,
    configured: Boolean(data.IMAGEKIT_PUBLIC_KEY && data.IMAGEKIT_PRIVATE_KEY && data.IMAGEKIT_URL_ENDPOINT),
  },
  mediaLimits: {
    imageBytes: Math.round(data.MEDIA_MAX_IMAGE_MB * 1024 * 1024),
    videoBytes: Math.round(data.MEDIA_MAX_VIDEO_MB * 1024 * 1024),
  },
  clientOrigins: data.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
};
