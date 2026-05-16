import { z } from 'zod';

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  TELEGRAM_BOT_USERNAME: z.string().optional(),
  PAYMENT_PROVIDER_TOKEN: z.string().optional(),
  VIP_PRICE_STARS: z.coerce.number().default(25),
  VIP_DURATION_DAYS: z.coerce.number().default(7),
  FREE_MATCH_COOLDOWN_SECONDS: z.coerce.number().default(30),
  VIP_MATCH_COOLDOWN_SECONDS: z.coerce.number().default(0),
  MESSAGE_RATE_LIMIT: z.coerce.number().default(10),
  MESSAGE_RATE_WINDOW_SECONDS: z.coerce.number().default(60),
  INITIAL_TRUST_SCORE: z.coerce.number().default(100),
  MIN_TRUST_SCORE: z.coerce.number().default(0),
  MAX_TRUST_SCORE: z.coerce.number().default(100),
  REFERRAL_VIP_HOURS: z.coerce.number().default(12),
  ADMIN_USER_IDS: z.string().transform((val) => {
    if (!val) return [];
    return val.split(',').map((id) => BigInt(id.trim()));
  }).default(''),
  SESSION_SECRET: z.string().min(32).default('default_secret_change_in_production'),
  ENABLE_REFERRALS: z.string().transform((val) => val === 'true').default('true'),
  ENABLE_PAYMENTS: z.string().transform((val) => val === 'true').default('true'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env | null = null;

export function loadEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  env = result.data;
  return env;
}

export function getEnv(): Env {
  if (!env) {
    return loadEnv();
  }
  return env;
}