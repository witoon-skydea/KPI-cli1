import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  HOST: z.string().default('localhost'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  DATABASE_PATH: z.string().default('kpi.db'),
  
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  RATE_LIMIT_MAX: z.string().default('100').transform(Number),
  RATE_LIMIT_WINDOW: z.string().default('900000').transform(Number), // 15 minutes
  
  API_TITLE: z.string().default('KPI Management API'),
  API_DESCRIPTION: z.string().default('Comprehensive API for managing staff performance indicators'),
  API_VERSION: z.string().default('1.0.0'),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('❌ Invalid environment configuration:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const config = validateEnv();

export default config;