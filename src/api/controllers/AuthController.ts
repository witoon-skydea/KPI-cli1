import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../../core/services/AuthService.js';
import { createSuccessResponse, createErrorResponse } from '../middleware/error.js';
import { 
  loginZodSchema,
  createUserZodSchema,
  changePasswordZodSchema,
  refreshTokenZodSchema
} from '../schemas/auth.js';
import type { 
  LoginRequest, 
  CreateUserRequest, 
  ChangePasswordRequest,
  RefreshTokenRequest,
  AuthenticatedRequest,
  AuthResponse
} from '../../types/api.js';

export class AuthController {
  private authService = new AuthService();

  async login(request: FastifyRequest, reply: FastifyReply) {
    // Validate request body
    const parseResult = loginZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', parseResult.error.issues)
      );
    }

    const { email, password } = parseResult.data;
    const { user, isValid } = await this.authService.validateLogin(email, password);

    if (!isValid || !user) {
      return reply.code(401).send(
        createErrorResponse('INVALID_CREDENTIALS', 'Invalid email or password')
      );
    }

    // Generate JWT tokens
    const jwtPayload = this.authService.createJWTPayload(user);
    const accessToken = await reply.jwtSign(jwtPayload);
    
    // For refresh token, we'll use a longer expiration
    const refreshToken = await reply.jwtSign(jwtPayload, { expiresIn: '7d' });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };

    return reply.send(createSuccessResponse(response));
  }

  async register(request: FastifyRequest, reply: FastifyReply) {
    const userData = request.body as CreateUserRequest;

    try {
      const user = await this.authService.createUser(userData);
      
      // Generate JWT tokens for the new user
      const jwtPayload = this.authService.createJWTPayload(user);
      const accessToken = await reply.jwtSign(jwtPayload);
      const refreshToken = await reply.jwtSign(jwtPayload, { expiresIn: '7d' });

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        tokens: {
          accessToken,
          refreshToken
        }
      };

      return reply.code(201).send(createSuccessResponse(response));
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return reply.code(409).send(
          createErrorResponse('USER_EXISTS', error.message)
        );
      }
      throw error;
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const { refreshToken } = request.body as RefreshTokenRequest;

    try {
      // Verify the refresh token
      const payload = await request.jwtVerify() as any;
      
      // Get fresh user data
      const user = await this.authService.findById(payload.userId);
      if (!user || !user.active) {
        return reply.code(401).send(
          createErrorResponse('INVALID_TOKEN', 'User not found or inactive')
        );
      }

      // Generate new tokens
      const jwtPayload = this.authService.createJWTPayload(user);
      const newAccessToken = await reply.jwtSign(jwtPayload);
      const newRefreshToken = await reply.jwtSign(jwtPayload, { expiresIn: '7d' });

      const response = {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      };

      return reply.send(createSuccessResponse(response));
    } catch (error) {
      return reply.code(401).send(
        createErrorResponse('INVALID_TOKEN', 'Invalid or expired refresh token')
      );
    }
  }

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const authRequest = request as AuthenticatedRequest;
    const user = await this.authService.findById(authRequest.user.userId);

    if (!user) {
      return reply.code(404).send(
        createErrorResponse('USER_NOT_FOUND', 'User not found')
      );
    }

    return reply.send(createSuccessResponse(user));
  }

  async updateProfile(request: FastifyRequest, reply: FastifyReply) {
    const authRequest = request as AuthenticatedRequest;
    const updateData = request.body as any;

    // Remove sensitive fields that shouldn't be updated here
    const { password, role, active, ...allowedUpdates } = updateData;

    const user = await this.authService.update(authRequest.user.userId, allowedUpdates);

    if (!user) {
      return reply.code(404).send(
        createErrorResponse('USER_NOT_FOUND', 'User not found')
      );
    }

    return reply.send(createSuccessResponse(user));
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply) {
    const authRequest = request as AuthenticatedRequest;
    const { currentPassword, newPassword } = request.body as ChangePasswordRequest;

    try {
      await this.authService.changePassword(
        authRequest.user.userId,
        currentPassword,
        newPassword
      );

      return reply.send(createSuccessResponse({ message: 'Password changed successfully' }));
    } catch (error: any) {
      if (error.message.includes('incorrect')) {
        return reply.code(400).send(
          createErrorResponse('INVALID_PASSWORD', error.message)
        );
      }
      throw error;
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    // In a real application, you might want to invalidate the token
    // For now, we'll just return a success message
    // The client should remove the token from storage
    return reply.send(createSuccessResponse({ message: 'Logged out successfully' }));
  }

  // Admin-only endpoints
  async getAllUsers(request: FastifyRequest, reply: FastifyReply) {
    const users = await this.authService.findAll();
    return reply.send(createSuccessResponse(users));
  }

  async createUser(request: FastifyRequest, reply: FastifyReply) {
    const userData = request.body as CreateUserRequest;

    try {
      const user = await this.authService.createUser(userData);
      return reply.code(201).send(createSuccessResponse(user));
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        return reply.code(409).send(
          createErrorResponse('USER_EXISTS', error.message)
        );
      }
      throw error;
    }
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const updateData = request.body as any;

    const user = await this.authService.update(parseInt(id), updateData);

    if (!user) {
      return reply.code(404).send(
        createErrorResponse('USER_NOT_FOUND', 'User not found')
      );
    }

    return reply.send(createSuccessResponse(user));
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    
    const success = await this.authService.delete(parseInt(id));

    if (!success) {
      return reply.code(404).send(
        createErrorResponse('USER_NOT_FOUND', 'User not found')
      );
    }

    return reply.send(createSuccessResponse({ message: 'User deleted successfully' }));
  }
}