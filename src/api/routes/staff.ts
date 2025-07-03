import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { StaffController } from '../controllers/StaffController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { UserRole } from '../../types/api.js';

const staffController = new StaffController();

export default async function staffRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // All staff routes require authentication
  fastify.addHook('preHandler', authenticateToken);

  // GET /staff - List all staff members
  fastify.get('/', {
    schema: {
      tags: ['Staff Management'],
      summary: 'Get all staff members',
      description: 'Retrieve a list of all staff members with optional filtering and pagination',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  employeeId: { type: 'string' },
                  name: { type: 'string' },
                  email: { type: 'string' },
                  departmentId: { type: 'number' },
                  departmentName: { type: 'string' },
                  position: { type: 'string' },
                  hireDate: { type: 'string' },
                  active: { type: 'boolean' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, staffController.getAll.bind(staffController));

  // GET /staff/:id - Get staff member by ID
  fastify.get('/:id', {
    schema: {
      tags: ['Staff Management'],
      summary: 'Get staff member by ID',
      description: 'Retrieve detailed information about a specific staff member',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                employeeId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                departmentId: { type: 'number' },
                departmentName: { type: 'string' },
                position: { type: 'string' },
                hireDate: { type: 'string' },
                active: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        404: {
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
  }, staffController.getById.bind(staffController));

  // POST /staff - Create new staff member
  fastify.post('/', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER)],
    schema: {
      tags: ['Staff Management'],
      summary: 'Create new staff member',
      description: 'Create a new staff member (Admin/Manager only)',
      security: [{ BearerAuth: [] }],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                employeeId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                departmentId: { type: 'number' },
                position: { type: 'string' },
                hireDate: { type: 'string' },
                active: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        400: {
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
        },
        409: {
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
  }, staffController.create.bind(staffController));

  // PUT /staff/:id - Update staff member
  fastify.put('/:id', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER)],
    schema: {
      tags: ['Staff Management'],
      summary: 'Update staff member',
      description: 'Update an existing staff member (Admin/Manager only)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                employeeId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                departmentId: { type: 'number' },
                position: { type: 'string' },
                hireDate: { type: 'string' },
                active: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        },
        404: {
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
  }, staffController.update.bind(staffController));

  // DELETE /staff/:id - Delete staff member
  fastify.delete('/:id', {
    preHandler: [requireRole(UserRole.ADMIN)],
    schema: {
      tags: ['Staff Management'],
      summary: 'Delete staff member',
      description: 'Delete a staff member (Admin only)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                message: { type: 'string' }
              }
            }
          }
        },
        404: {
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
  }, staffController.delete.bind(staffController));

  // PATCH /staff/:id/activate - Activate staff member
  fastify.patch('/:id/activate', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER)],
    schema: {
      tags: ['Staff Management'],
      summary: 'Activate staff member',
      description: 'Activate a staff member (Admin/Manager only)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                employeeId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                departmentId: { type: 'number' },
                position: { type: 'string' },
                hireDate: { type: 'string' },
                active: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, staffController.activate.bind(staffController));

  // PATCH /staff/:id/deactivate - Deactivate staff member
  fastify.patch('/:id/deactivate', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER)],
    schema: {
      tags: ['Staff Management'],
      summary: 'Deactivate staff member',
      description: 'Deactivate a staff member (Admin/Manager only)',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                employeeId: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                departmentId: { type: 'number' },
                position: { type: 'string' },
                hireDate: { type: 'string' },
                active: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, staffController.deactivate.bind(staffController));

  // GET /staff/:id/performance - Get staff performance data
  fastify.get('/:id/performance', {
    schema: {
      tags: ['Staff Management'],
      summary: 'Get staff performance',
      description: 'Retrieve performance data and analytics for a specific staff member',
      security: [{ BearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                staff: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    employeeId: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    departmentId: { type: 'number' },
                    departmentName: { type: 'string' },
                    position: { type: 'string' },
                    active: { type: 'boolean' }
                  }
                },
                currentPeriod: {
                  type: 'object',
                  properties: {
                    year: { type: 'number' },
                    quarter: { type: 'number' },
                    evaluations: { type: 'number' },
                    totalScore: { type: 'number' },
                    maxPossibleScore: { type: 'number' },
                    percentage: { type: 'number' },
                    grade: { type: 'string' }
                  }
                },
                yearlyEvaluations: { type: 'number' },
                kpisAssigned: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, staffController.getPerformance.bind(staffController));
}