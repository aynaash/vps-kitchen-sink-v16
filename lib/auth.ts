import { betterAuth } from 'better-auth';
import { pool } from './postgres';

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || 'super-secret-key-pingpulse-development-2026',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3005',
  user: {
    modelName: 'users',
  },
  session: {
    modelName: 'sessions',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  account: {
    modelName: 'accounts',
  },
  verification: {
    modelName: 'verifications',
  },
  emailAndPassword: {
    enabled: true,
  },
});
