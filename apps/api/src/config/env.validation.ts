import * as Joi from 'joi';

/**
 * Fails the app fast at boot with a clear error listing every missing/invalid
 * variable, instead of booting successfully on an empty config and surfacing
 * a cryptic Prisma/JWT failure on the first real request. `.unknown(true)` is
 * required because this validates the entire `process.env`, which always
 * contains many OS/platform variables this schema doesn't (and shouldn't) know
 * about (PATH, HOME, RAILWAY_*, etc.) — without it every boot would fail.
 */
export const envValidationSchema = Joi.object({
  // .empty('') maps an empty-string value (e.g. an unset/blank platform env var,
  // as opposed to a truly absent key) to undefined so .default() still applies —
  // otherwise a blank NODE_ENV fails .valid() and crash-loops the app at boot.
  NODE_ENV: Joi.string().empty('').valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().port().default(3001),
  BASE_URL: Joi.string().uri().optional(),
  FRONTEND_URL: Joi.string().uri().optional(),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),

  DATABASE_URL: Joi.string()
    .pattern(/^postgres(ql)?:\/\//)
    .required()
    .messages({ 'string.pattern.base': 'DATABASE_URL must be a postgres:// or postgresql:// connection string' }),

  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  PUPPETEER_EXECUTABLE_PATH: Joi.string().optional(),
}).unknown(true);
