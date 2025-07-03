import type { FastifyRequest, FastifyReply } from 'fastify';
import type { JWTPayload, AuthenticatedRequest } from '../../types/api.js';
import { UserRole } from '../../types/api.js';

// Authentication middleware to verify JWT tokens
export async function authenticateToken(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.code(401).send({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required'
        }
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token using Fastify JWT plugin
    const payload = await request.jwtVerify() as JWTPayload;
    
    // Add user data to request
    (request as AuthenticatedRequest).user = payload;
  } catch (error) {
    reply.code(401).send({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired access token'
      }
    });
  }
}

// Authorization middleware to check user roles
export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = (request as AuthenticatedRequest).user;
    
    if (!user) {
      reply.code(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
      return;
    }
  };
}

// Middleware to check if user can access staff data
export async function canAccessStaff(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = (request as AuthenticatedRequest).user;
  const { id: staffId } = request.params as { id: string };
  
  // Admins and managers can access any staff data
  if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
    return;
  }
  
  // Employees can only access their own data
  if (user.role === UserRole.EMPLOYEE) {
    if (user.staffId && user.staffId.toString() === staffId) {
      return;
    }
    
    reply.code(403).send({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You can only access your own staff data'
      }
    });
    return;
  }
  
  reply.code(403).send({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied'
    }
  });
}

// Middleware to check if user can access department data
export async function canAccessDepartment(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const user = (request as AuthenticatedRequest).user;
  
  // Admins can access any department
  if (user.role === UserRole.ADMIN) {
    return;
  }
  
  // For managers and employees, we would need to check their department
  // This is simplified - in a real app, you'd check the user's department
  if (user.role === UserRole.MANAGER || user.role === UserRole.EMPLOYEE) {
    // TODO: Add department-specific access control logic
    return;
  }
  
  reply.code(403).send({
    success: false,
    error: {
      code: 'FORBIDDEN',
      message: 'Access denied'
    }
  });
}