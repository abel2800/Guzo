import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function bool(key: string, fallback = false): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
}

function num(key: string, fallback: number): number {
  const v = process.env[key];
  return v === undefined ? fallback : Number(v);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
  appName: process.env.APP_NAME ?? 'DeliveryPlatform',
  apiVersion: process.env.API_VERSION ?? 'v1',
  port: num('PORT', 4000),
  host: process.env.HOST ?? '0.0.0.0',
  publicUrl: process.env.API_PUBLIC_URL ?? 'http://localhost:4000',

  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),

  databaseUrl: required('DATABASE_URL'),

  jwt: {
    accessSecret: required('JWT_ACCESS_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  bcryptRounds: num('BCRYPT_SALT_ROUNDS', 10),

  redis: {
    enabled: bool('REDIS_ENABLED', false),
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
    maxFileSizeMb: num('MAX_FILE_SIZE_MB', 10),
  },

  email: {
    driver: process.env.EMAIL_DRIVER ?? 'console',
    host: process.env.SMTP_HOST ?? 'localhost',
    port: num('SMTP_PORT', 1025),
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    secure: bool('SMTP_SECURE', false),
    from: process.env.MAIL_FROM ?? 'Delivery Platform <no-reply@delivery.local>',
  },

  maps: {
    osrmBaseUrl: process.env.OSRM_BASE_URL ?? 'https://router.project-osrm.org',
    nominatimBaseUrl: process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org',
  },

  payment: {
    provider: process.env.PAYMENT_PROVIDER ?? 'fake',
  },

  sms: {
    driver: process.env.SMS_DRIVER ?? 'console',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID ?? '',
      authToken: process.env.TWILIO_AUTH_TOKEN ?? '',
      fromNumber: process.env.TWILIO_FROM_NUMBER ?? '',
    },
  },
  push: { driver: process.env.PUSH_DRIVER ?? 'console' },

  rateLimit: {
    windowMs: num('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: num('RATE_LIMIT_MAX', 300),
  },

  logLevel: process.env.LOG_LEVEL ?? 'debug',
} as const;

export type Env = typeof env;
