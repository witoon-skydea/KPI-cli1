import type { FastifyRequest, FastifyReply } from 'fastify';
import { StaffService } from '../../core/services/StaffService.js';
import { DepartmentService } from '../../core/services/DepartmentService.js';
import { EvaluationService } from '../../core/services/EvaluationService.js';
import { createSuccessResponse, createErrorResponse } from '../middleware/error.js';
import { 
  createStaffZodSchema,
  updateStaffZodSchema
} from '../schemas/common.js';
import type { 
  CreateStaffRequest,
  UpdateStaffRequest,
  StaffQueryParams,
  IdParams
} from '../schemas/common.js';

export class StaffController {
  private staffService = new StaffService();
  private departmentService = new DepartmentService();
  private evaluationService = new EvaluationService();

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as any;
    
    // Get all staff
    let staff = await this.staffService.findAll();
    
    // Apply filters if specified
    if (query.departmentId) {
      const departmentId = parseInt(query.departmentId);
      staff = staff.filter(s => s.departmentId === departmentId);
    }
    
    if (query.active !== undefined) {
      const active = query.active === 'true';
      staff = staff.filter(s => s.active === active);
    }
    
    if (query.position) {
      staff = staff.filter(s => 
        s.position && s.position.toLowerCase().includes(query.position!.toLowerCase())
      );
    }
    
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      staff = staff.filter(s => 
        s.name.toLowerCase().includes(searchTerm) ||
        s.email.toLowerCase().includes(searchTerm) ||
        s.employeeId.toLowerCase().includes(searchTerm) ||
        (s.position && s.position.toLowerCase().includes(searchTerm)) ||
        (s.departmentName && s.departmentName.toLowerCase().includes(searchTerm))
      );
    }

    // Apply sorting
    if (query.sort) {
      const sortField = query.sort as keyof typeof staff[0];
      staff.sort((a, b) => {
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
    
    const paginatedStaff = staff.slice(startIndex, endIndex);
    const total = staff.length;
    const totalPages = Math.ceil(total / limit);

    const pagination = {
      page,
      limit,
      total,
      totalPages
    };

    return reply.send(createSuccessResponse(paginatedStaff, pagination));
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    const staffMember = await this.staffService.findById(id);
    
    if (!staffMember) {
      return reply.code(404).send(
        createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
      );
    }

    return reply.send(createSuccessResponse(staffMember));
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    // Validate request body
    const parseResult = createStaffZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', parseResult.error.issues)
      );
    }

    const staffData = parseResult.data;
    
    try {
      // Check if employee ID already exists
      const existingByEmployeeId = await this.staffService.findByEmployeeId(staffData.employeeId);
      if (existingByEmployeeId) {
        return reply.code(409).send(
          createErrorResponse('EMPLOYEE_ID_EXISTS', 'Employee ID already exists')
        );
      }

      // Check if email already exists
      const existingByEmail = await this.staffService.findByEmail(staffData.email);
      if (existingByEmail) {
        return reply.code(409).send(
          createErrorResponse('EMAIL_EXISTS', 'Email already exists')
        );
      }

      const createInput: any = {
        employeeId: staffData.employeeId,
        name: staffData.name,
        email: staffData.email
      };
      
      if (staffData.departmentId !== undefined) {
        createInput.departmentId = staffData.departmentId;
      }
      if (staffData.position !== undefined) {
        createInput.position = staffData.position;
      }
      if (staffData.hireDate !== undefined) {
        createInput.hireDate = staffData.hireDate;
      }

      const staffMember = await this.staffService.create(createInput);
      return reply.code(201).send(createSuccessResponse(staffMember));
    } catch (error: any) {
      if (error.message.includes('Department with ID')) {
        return reply.code(400).send(
          createErrorResponse('INVALID_DEPARTMENT', error.message)
        );
      }
      throw error;
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    // Validate request body
    const parseResult = updateStaffZodSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.code(400).send(
        createErrorResponse('VALIDATION_ERROR', 'Invalid request data', parseResult.error.issues)
      );
    }

    const updateData = parseResult.data;
    
    try {
      // Check if staff exists
      const existingStaff = await this.staffService.findById(id);
      if (!existingStaff) {
        return reply.code(404).send(
          createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
        );
      }

      // Check if employee ID is being changed and already exists
      if (updateData.employeeId && updateData.employeeId !== existingStaff.employeeId) {
        const existingByEmployeeId = await this.staffService.findByEmployeeId(updateData.employeeId);
        if (existingByEmployeeId) {
          return reply.code(409).send(
            createErrorResponse('EMPLOYEE_ID_EXISTS', 'Employee ID already exists')
          );
        }
      }

      // Check if email is being changed and already exists
      if (updateData.email && updateData.email !== existingStaff.email) {
        const existingByEmail = await this.staffService.findByEmail(updateData.email);
        if (existingByEmail) {
          return reply.code(409).send(
            createErrorResponse('EMAIL_EXISTS', 'Email already exists')
          );
        }
      }

      const updateInput: any = {};
      
      if (updateData.employeeId !== undefined) {
        updateInput.employeeId = updateData.employeeId;
      }
      if (updateData.name !== undefined) {
        updateInput.name = updateData.name;
      }
      if (updateData.email !== undefined) {
        updateInput.email = updateData.email;
      }
      if (updateData.departmentId !== undefined) {
        updateInput.departmentId = updateData.departmentId;
      }
      if (updateData.position !== undefined) {
        updateInput.position = updateData.position;
      }
      if (updateData.hireDate !== undefined) {
        updateInput.hireDate = updateData.hireDate;
      }
      if (updateData.active !== undefined) {
        updateInput.active = updateData.active;
      }

      const staffMember = await this.staffService.update(id, updateInput);
      
      if (!staffMember) {
        return reply.code(404).send(
          createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
        );
      }

      return reply.send(createSuccessResponse(staffMember));
    } catch (error: any) {
      if (error.message.includes('Department with ID')) {
        return reply.code(400).send(
          createErrorResponse('INVALID_DEPARTMENT', error.message)
        );
      }
      throw error;
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    const success = await this.staffService.delete(id);
    
    if (!success) {
      return reply.code(404).send(
        createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
      );
    }

    return reply.send(createSuccessResponse({ message: 'Staff member deleted successfully' }));
  }

  async activate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    const staffMember = await this.staffService.setActive(id, true);
    
    if (!staffMember) {
      return reply.code(404).send(
        createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
      );
    }

    return reply.send(createSuccessResponse(staffMember));
  }

  async deactivate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    const staffMember = await this.staffService.setActive(id, false);
    
    if (!staffMember) {
      return reply.code(404).send(
        createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
      );
    }

    return reply.send(createSuccessResponse(staffMember));
  }

  async getPerformance(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as IdParams;
    
    // Check if staff exists
    const staffMember = await this.staffService.findById(id);
    if (!staffMember) {
      return reply.code(404).send(
        createErrorResponse('STAFF_NOT_FOUND', 'Staff member not found')
      );
    }

    // Get performance data for the staff member
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    
    try {
      // Get current period evaluations
      const currentEvaluations = await this.evaluationService.getStaffEvaluations(id, currentYear, currentQuarter);
      
      // Get all evaluations for this staff member in the current year
      const staffYearlyEvaluations: any[] = [];
      for (let quarter = 1; quarter <= 4; quarter++) {
        try {
          const quarterEvaluations = await this.evaluationService.getStaffEvaluations(id, currentYear, quarter);
          staffYearlyEvaluations.push(...quarterEvaluations);
        } catch (error) {
          // Quarter might not have evaluations, continue
        }
      }
      
      // Calculate performance metrics
      let currentPeriodScore = 0;
      let maxPossibleScore = 0;
      
      if (currentEvaluations.length > 0) {
        currentEvaluations.forEach(evaluation => {
          currentPeriodScore += (evaluation.score || 0) * (evaluation.weight || 1);
          maxPossibleScore += 5 * (evaluation.weight || 1);
        });
      }
      
      const performancePercentage = maxPossibleScore > 0 ? (currentPeriodScore / maxPossibleScore) * 100 : 0;
      
      // Calculate grade based on percentage
      let grade = 'F';
      if (performancePercentage >= 90) grade = 'A';
      else if (performancePercentage >= 85) grade = 'B+';
      else if (performancePercentage >= 80) grade = 'B';
      else if (performancePercentage >= 75) grade = 'C+';
      else if (performancePercentage >= 70) grade = 'C';
      else if (performancePercentage >= 65) grade = 'D+';
      else if (performancePercentage >= 60) grade = 'D';

      const performance = {
        staff: staffMember,
        currentPeriod: {
          year: currentYear,
          quarter: currentQuarter,
          evaluations: currentEvaluations.length,
          totalScore: Math.round(currentPeriodScore * 100) / 100,
          maxPossibleScore: Math.round(maxPossibleScore * 100) / 100,
          percentage: Math.round(performancePercentage * 100) / 100,
          grade
        },
        yearlyEvaluations: staffYearlyEvaluations.length,
        kpisAssigned: currentEvaluations.length
      };

      return reply.send(createSuccessResponse(performance));
    } catch (error) {
      // If no evaluations found, return basic info
      const performance = {
        staff: staffMember,
        currentPeriod: {
          year: currentYear,
          quarter: currentQuarter,
          evaluations: 0,
          totalScore: 0,
          maxPossibleScore: 0,
          percentage: 0,
          grade: 'N/A'
        },
        yearlyEvaluations: 0,
        kpisAssigned: 0
      };

      return reply.send(createSuccessResponse(performance));
    }
  }
}