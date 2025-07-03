import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import type { APIResponse } from '../../types/api.js';

// Global error handler for the API
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log the error for debugging
  request.log.error(error);

  let statusCode = error.statusCode || 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  // Handle different types of errors
  if (error.validation) {
    // Validation errors from request body/params
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.validation;
  } else if (error.statusCode === 401) {
    errorCode = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.statusCode === 403) {
    errorCode = 'FORBIDDEN';
    message = 'Access denied';
  } else if (error.statusCode === 404) {
    errorCode = 'NOT_FOUND';
    message = 'Resource not found';
  } else if (error.statusCode === 409) {
    errorCode = 'CONFLICT';
    message = 'Resource conflict';
  } else if (error.statusCode === 429) {
    errorCode = 'RATE_LIMITED';
    message = 'Too many requests';
  } else if (error.message) {
    // Use the actual error message if available
    message = error.message;
    
    // Handle specific database errors
    if (error.message.includes('UNIQUE constraint failed')) {
      statusCode = 409;
      errorCode = 'DUPLICATE_RESOURCE';
      message = 'Resource already exists';
    } else if (error.message.includes('FOREIGN KEY constraint failed')) {
      statusCode = 400;
      errorCode = 'INVALID_REFERENCE';
      message = 'Invalid reference to related resource';
    }
  }

  const response: APIResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details })
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    (response.error as any).stack = error.stack;
  }

  reply.code(statusCode).send(response);
}

// 404 handler for routes that don't exist
export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const response: APIResponse = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`
    }
  };

  reply.code(404).send(response);
}

// Create standardized API responses
export function createSuccessResponse<T>(data: T, pagination?: any): APIResponse<T> {
  return {
    success: true,
    data,
    ...(pagination && { pagination })
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): APIResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };
}

// Async error wrapper for route handlers
export function asyncHandler<T extends any[]>(
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    try {
      return await handler(...args);
    } catch (error) {
      // Re-throw to be caught by global error handler
      throw error;
    }
  };
}