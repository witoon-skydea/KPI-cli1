import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { UserRole } from '../../types/api.js';
import {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  refreshTokenSchema
} from '../schemas/auth.js';
import { idParamSchema } from '../schemas/common.js';

const authController = new AuthController();

export default async function authRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // Public routes (no authentication required)
  
  // POST /auth/login
  fastify.post('/login', {
    schema: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user with email and password',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, authController.login.bind(authController));

  // POST /auth/register
  fastify.post('/register', {
    schema: {
      tags: ['Authentication'],
      summary: 'User registration',
      description: 'Register a new user account',
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' }
                  }
                },
                tokens: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    refreshToken: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, authController.register.bind(authController));

  // POST /auth/refresh
  fastify.post('/refresh', {
    schema: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description: 'Get a new access token using refresh token'
    }
  }, authController.refreshToken.bind(authController));

  // Protected routes (authentication required)
  
  // GET /auth/profile
  fastify.get('/profile', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Authentication'],
      summary: 'Get user profile',
      description: 'Get current user profile information',
      security: [{ BearerAuth: [] }]
    }
  }, authController.getProfile.bind(authController));

  // PUT /auth/profile
  fastify.put('/profile', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Authentication'],
      summary: 'Update user profile',
      description: 'Update current user profile information',
      security: [{ BearerAuth: [] }]
    }
  }, authController.updateProfile.bind(authController));

  // POST /auth/change-password
  fastify.post('/change-password', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Authentication'],
      summary: 'Change password',
      description: 'Change current user password',
      security: [{ BearerAuth: [] }]
    }
  }, authController.changePassword.bind(authController));

  // POST /auth/logout
  fastify.post('/logout', {
    preHandler: [authenticateToken],
    schema: {
      tags: ['Authentication'],
      summary: 'User logout',
      description: 'Logout current user',
      security: [{ BearerAuth: [] }]
    }
  }, authController.logout.bind(authController));

  // Admin-only routes
  
  // GET /auth/users
  fastify.get('/users', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)],
    schema: {
      tags: ['User Management'],
      summary: 'Get all users',
      description: 'Get list of all users (Admin only)',
      security: [{ BearerAuth: [] }]
    }
  }, authController.getAllUsers.bind(authController));

  // POST /auth/users
  fastify.post('/users', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)],
    schema: {
      tags: ['User Management'],
      summary: 'Create user',
      description: 'Create a new user (Admin only)',
      security: [{ BearerAuth: [] }]
    }
  }, authController.createUser.bind(authController));

  // PUT /auth/users/:id
  fastify.put('/users/:id', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)],
    schema: {
      tags: ['User Management'],
      summary: 'Update user',
      description: 'Update user information (Admin only)',
      security: [{ BearerAuth: [] }]
    }
  }, authController.updateUser.bind(authController));

  // DELETE /auth/users/:id
  fastify.delete('/users/:id', {
    preHandler: [authenticateToken, requireRole(UserRole.ADMIN)],
    schema: {
      tags: ['User Management'],
      summary: 'Delete user',
      description: 'Delete user account (Admin only)',
      security: [{ BearerAuth: [] }]
    }
  }, authController.deleteUser.bind(authController));
}