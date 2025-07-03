import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { UserRole } from '../../types/api.js';

// Zod schemas for validation
export const loginZodSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const createUserZodSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRole),
  staffId: z.number().optional()
});

export const updateUserZodSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  staffId: z.number().optional(),
  active: z.boolean().optional()
});

export const changePasswordZodSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

export const refreshTokenZodSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const jwtPayloadZodSchema = z.object({
  userId: z.number(),
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
  iat: z.number().optional(),
  exp: z.number().optional()
});

// JSON schemas for Fastify
export const loginSchema = zodToJsonSchema(loginZodSchema);
export const createUserSchema = zodToJsonSchema(createUserZodSchema);
export const updateUserSchema = zodToJsonSchema(updateUserZodSchema);
export const changePasswordSchema = zodToJsonSchema(changePasswordZodSchema);
export const refreshTokenSchema = zodToJsonSchema(refreshTokenZodSchema);
export const jwtPayloadSchema = zodToJsonSchema(jwtPayloadZodSchema);

// Types derived from Zod schemas
export type LoginRequest = z.infer<typeof loginZodSchema>;
export type CreateUserRequest = z.infer<typeof createUserZodSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserZodSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordZodSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenZodSchema>;
export type JWTPayload = z.infer<typeof jwtPayloadZodSchema>;