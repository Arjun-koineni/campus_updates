import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

dotenv.config({ path: [path.resolve('.env'), path.resolve('../../.env')] });
const env = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  SESSION_TTL_HOURS: z.coerce.number().positive().max(168).default(24),
  COOKIE_NAME: z.string().default('campus_session'),
  APP_TIMEZONE: z.string().default('Asia/Kolkata'),
  EXPIRY_GRACE_HOURS: z.coerce.number().nonnegative().default(2.5),
  MOCK_EMAIL: z.enum(['true', 'false']).default('true'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('campus@example.edu'),
  EMAIL_FROM_NAME: z.string().default('Campus Updates'),
  S3_ENDPOINT: z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional()),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_BASE_URL: z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional())
}).parse({ ...process.env, JWT_SECRET: process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? undefined : 'development-only-secret-at-least-32-characters') });

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  webOrigin: new URL(env.WEB_ORIGIN).origin,
  jwtSecret: env.JWT_SECRET,
  sessionTtlHours: env.SESSION_TTL_HOURS,
  cookieName: env.COOKIE_NAME,
  appTimezone: env.APP_TIMEZONE,
  expiryGraceHours: env.EXPIRY_GRACE_HOURS,
  mockEmail: env.MOCK_EMAIL === 'true',
  redisUrl: env.REDIS_URL,
  brevoApiKey: env.BREVO_API_KEY,
  emailFrom: env.EMAIL_FROM,
  emailFromName: env.EMAIL_FROM_NAME,
  s3: { endpoint: env.S3_ENDPOINT, region: env.S3_REGION, bucket: env.S3_BUCKET, accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY, publicBaseUrl: env.S3_PUBLIC_BASE_URL }
};

if (config.nodeEnv === 'production' && !config.webOrigin.startsWith('https://')) {
  throw new Error('WEB_ORIGIN must use HTTPS in production');
}
if (config.nodeEnv === 'production' && config.mockEmail) {
  throw new Error('Configure Brevo email and set MOCK_EMAIL=false in production');
}
