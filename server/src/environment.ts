import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'] as const;

for (const key of required) {
  if (!process.env[key]) {
    // eslint-disable-next-line no-console
    console.warn(`Environment variable ${key} is not set. The API may fail to start.`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
};
