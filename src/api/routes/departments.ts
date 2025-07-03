import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { DepartmentController } from '../controllers/DepartmentController.js';
import { authenticateToken, requireRole, canAccessDepartment } from '../middleware/auth.js';
import { UserRole } from '../../types/api.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema,
  idParamSchema
} from '../schemas/common.js';

const departmentController = new DepartmentController();

export default async function departmentRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // All routes require authentication
  fastify.addHook('preHandler', authenticateToken);

  // GET /departments
  fastify.get('/', {
    schema: {
      tags: ['Departments'],
      summary: 'Get all departments',
      description: 'Retrieve a list of all departments with optional filtering and pagination',
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
                  name: { type: 'string' },
                  description: { type: 'string' },
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
  }, departmentController.getAll.bind(departmentController));

  // GET /departments/:id
  fastify.get('/:id', {
    preHandler: [canAccessDepartment],
    schema: {
      tags: ['Departments'],
      summary: 'Get department by ID',
      description: 'Retrieve a specific department by its ID',
      security: [{ BearerAuth: [] }]
    }
  }, departmentController.getById.bind(departmentController));

  // POST /departments
  fastify.post('/', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER)],
    schema: {
      tags: ['Departments'],
      summary: 'Create department',
      description: 'Create a new department (Admin/Manager only)',
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
                name: { type: 'string' },
                description: { type: 'string' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, departmentController.create.bind(departmentController));

  // PUT /departments/:id
  fastify.put('/:id', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER), canAccessDepartment],
    schema: {
      tags: ['Departments'],
      summary: 'Update department',
      description: 'Update an existing department (Admin/Manager only)',
      security: [{ BearerAuth: [] }]
    }
  }, departmentController.update.bind(departmentController));

  // DELETE /departments/:id
  fastify.delete('/:id', {
    preHandler: [requireRole(UserRole.ADMIN), canAccessDepartment],
    schema: {
      tags: ['Departments'],
      summary: 'Delete department',
      description: 'Delete a department (Admin only)',
      security: [{ BearerAuth: [] }]
    }
  }, departmentController.delete.bind(departmentController));

  // GET /departments/:id/staff
  fastify.get('/:id/staff', {
    preHandler: [canAccessDepartment],
    schema: {
      tags: ['Departments'],
      summary: 'Get department staff',
      description: 'Get all staff members in a specific department',
      security: [{ BearerAuth: [] }]
    }
  }, departmentController.getStaff.bind(departmentController));

  // GET /departments/:id/stats
  fastify.get('/:id/stats', {
    preHandler: [requireRole(UserRole.ADMIN, UserRole.MANAGER), canAccessDepartment],
    schema: {
      tags: ['Departments'],
      summary: 'Get department statistics',
      description: 'Get performance statistics for a department (Admin/Manager only)',
      security: [{ BearerAuth: [] }]
    }
  }, departmentController.getStats.bind(departmentController));
}