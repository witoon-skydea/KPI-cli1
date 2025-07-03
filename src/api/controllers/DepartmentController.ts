import type { FastifyRequest, FastifyReply } from 'fastify';
import { DepartmentService } from '../../core/services/DepartmentService.js';
import { StaffService } from '../../core/services/StaffService.js';
import { EvaluationService } from '../../core/services/EvaluationService.js';
import { createSuccessResponse, createErrorResponse } from '../middleware/error.js';
import type { 
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentQueryParams,
  IdParams
} from '../schemas/common.js';

export class DepartmentController {
  private departmentService = new DepartmentService();
  private staffService = new StaffService();
  private evaluationService = new EvaluationService();

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as DepartmentQueryParams;
    
    // Get all departments
    const departments = await this.departmentService.findAll();
    
    // Apply filters if specified
    let filteredDepartments = departments;
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredDepartments = departments.filter(dept => 
        dept.name.toLowerCase().includes(searchTerm) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (query.sort) {
      const sortField = query.sort as keyof typeof departments[0];
      filteredDepartments.sort((a, b) => {
        const aVal = a[sortField] as string;
        const bVal = b[sortField] as string;
        
        if (query.order === 'desc') {
          return bVal.localeCompare(aVal);
        }
        return aVal.localeCompare(bVal);
      });
    }

    // Apply pagination
    const page = query.page || 1;
    const limit = query.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);
    const total = filteredDepartments.length;
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages
    };

    return reply.send(createSuccessResponse(paginatedDepartments, pagination));
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    const department = await this.departmentService.findById(id);
    
    if (!department) {
      return reply.code(404).send(
        createErrorResponse('DEPARTMENT_NOT_FOUND', 'Department not found')
      );
    }

    return reply.send(createSuccessResponse(department));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const departmentData = request.body as CreateDepartmentRequest;
    
    try {
      const department = await this.departmentService.create(departmentData);
      return reply.code(201).send(createSuccessResponse(department));
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return reply.code(409).send(
          createErrorResponse('DEPARTMENT_EXISTS', 'Department with this name already exists')
        );
      }
      throw error;
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    const updateData = request.body as UpdateDepartmentRequest;
    
    try {
      const department = await this.departmentService.update(id, updateData);
      
      if (!department) {
        return reply.code(404).send(
          createErrorResponse('DEPARTMENT_NOT_FOUND', 'Department not found')
        );
      }

      return reply.send(createSuccessResponse(department));
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return reply.code(409).send(
          createErrorResponse('DEPARTMENT_EXISTS', 'Department with this name already exists')
        );
      }
      throw error;
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    const success = await this.departmentService.delete(id);
    
    if (!success) {
      return reply.code(404).send(
        createErrorResponse('DEPARTMENT_NOT_FOUND', 'Department not found')
      );
    }

    return reply.send(createSuccessResponse({ message: 'Department deleted successfully' }));
  }

  async getStaff(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    // Check if department exists
    const department = await this.departmentService.findById(id);
    if (!department) {
      return reply.code(404).send(
        createErrorResponse('DEPARTMENT_NOT_FOUND', 'Department not found')
      );
    }

    // Get staff in this department
    const staff = await this.staffService.findByDepartment(id);

    return reply.send(createSuccessResponse(staff));
  }

  async getStats(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    // Check if department exists
    const department = await this.departmentService.findById(id);
    if (!department) {
      return reply.code(404).send(
        createErrorResponse('DEPARTMENT_NOT_FOUND', 'Department not found')
      );
    }

    // Get department statistics
    const staff = await this.staffService.findByDepartment(id);
    const activeStaff = staff.filter(s => s.active);
    
    // Get recent evaluations for the department
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    
    let totalEvaluations = 0;
    let averageScore = 0;
    
    try {
      const evaluations = await this.evaluationService.getPeriodEvaluations(currentYear, currentQuarter);
      const departmentEvaluations = evaluations.filter(evaluation => 
        staff.some(s => s.id === evaluation.staffId)
      );
      
      totalEvaluations = departmentEvaluations.length;
      if (totalEvaluations > 0) {
        averageScore = departmentEvaluations.reduce((sum, evaluation) => sum + (evaluation.score || 0), 0) / totalEvaluations;
      }
    } catch (error) {
      // If no evaluations found, keep defaults
    }

    const stats = {
      department,
      staff: {
        total: staff.length,
        active: activeStaff.length,
        inactive: staff.length - activeStaff.length
      },
      performance: {
        currentPeriod: {
          year: currentYear,
          quarter: currentQuarter,
          evaluations: totalEvaluations,
          averageScore: Math.round(averageScore * 100) / 100
        }
      }
    };

    return reply.send(createSuccessResponse(stats));
  }
}