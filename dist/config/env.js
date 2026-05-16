"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
exports.getEnv = getEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    BOT_TOKEN: zod_1.z.string().min(1),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_HOST: zod_1.z.string().default('localhost'),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    LOG_LEVEL: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    TELEGRAM_BOT_USERNAME: zod_1.z.string().optional(),
    PAYMENT_PROVIDER_TOKEN: zod_1.z.string().optional(),
    VIP_PRICE_STARS: zod_1.z.coerce.number().default(25),
    VIP_DURATION_DAYS: zod_1.z.coerce.number().default(7),
    FREE_MATCH_COOLDOWN_SECONDS: zod_1.z.coerce.number().default(30),
    VIP_MATCH_COOLDOWN_SECONDS: zod_1.z.coerce.number().default(0),
    MESSAGE_RATE_LIMIT: zod_1.z.coerce.number().default(10),
    MESSAGE_RATE_WINDOW_SECONDS: zod_1.z.coerce.number().default(60),
    INITIAL_TRUST_SCORE: zod_1.z.coerce.number().default(100),
    MIN_TRUST_SCORE: zod_1.z.coerce.number().default(0),
    MAX_TRUST_SCORE: zod_1.z.coerce.number().default(100),
    REFERRAL_VIP_HOURS: zod_1.z.coerce.number().default(12),
    ADMIN_USER_IDS: zod_1.z.string().transform((val) => {
        if (!val)
            return [];
        return val.split(',').map((id) => BigInt(id.trim()));
    }).default(''),
    SESSION_SECRET: zod_1.z.string().min(32).default('default_secret_change_in_production'),
    ENABLE_REFERRALS: zod_1.z.string().transform((val) => val === 'true').default('true'),
    ENABLE_PAYMENTS: zod_1.z.string().transform((val) => val === 'true').default('true'),
});
let env = null;
function loadEnv() {
    if (env)
        return env;
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
function getEnv() {
    if (!env) {
        return loadEnv();
    }
    return env;
}
//# sourceMappingURL=env.js.map