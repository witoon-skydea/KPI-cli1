import type { FastifyRequest, FastifyReply } from 'fastify';

// Standard API Response Format
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Common Query Parameters
export interface QueryParams extends PaginationParams {
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

// Authentication
export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  staffId?: number;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: JWTPayload;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// User Management
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee'
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  staffId?: number; // Link to staff record if applicable
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  staffId?: number;
}

// Error Handling
export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Department API Types
export interface DepartmentQueryParams extends QueryParams {
  active?: boolean;
}

// Staff API Types
export interface StaffQueryParams extends QueryParams {
  departmentId?: number;
  active?: boolean;
  position?: string;
}

// KPI API Types
export interface KPIQueryParams extends QueryParams {
  active?: boolean;
  weight?: number;
}

export interface KPITestFormulaRequest {
  variables: Record<string, number>;
}

export interface KPITestFormulaResponse {
  result: number;
  variables: Record<string, number>;
  formula: string;
  success: boolean;
  error?: string;
}

// Data Entry API Types
export interface DataEntryQueryParams extends QueryParams {
  staffId?: number;
  kpiId?: number;
  departmentId?: number;
  year?: number;
  quarter?: number;
}

export interface CreateDataEntryRequest {
  staffId: number;
  kpiId: number;
  periodYear: number;
  periodQuarter: number;
  dataValues: Record<string, unknown>;
}

// Assignment API Types
export interface AssignmentRequest {
  staffId: number;
  kpiId: number;
  assignedDate?: string;
}

export interface BulkAssignmentRequest {
  assignments: AssignmentRequest[];
}

// Reporting API Types
export interface ReportQueryParams {
  departmentId?: number;
  year?: number;
  quarter?: number;
  format?: 'json' | 'pdf' | 'excel';
}

export interface DashboardData {
  summary: {
    totalDepartments: number;
    totalStaff: number;
    totalKPIs: number;
    totalEvaluations: number;
  };
  recentActivity: {
    recentEvaluations: any[];
    recentDataEntries: any[];
  };
  performance: {
    departmentAverages: Array<{
      departmentId: number;
      departmentName: string;
      averageScore: number;
      staffCount: number;
    }>;
    topPerformers: any[];
  };
}

// File Upload Types
export interface FileUploadRequest {
  file: Buffer;
  filename: string;
  mimetype: string;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  services: {
    [serviceName: string]: 'operational' | 'degraded' | 'down';
  };
}

// Export utility type for route handlers
export type RouteHandler<T = any> = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<APIResponse<T>>;

export type AuthenticatedRouteHandler<T = any> = (
  request: AuthenticatedRequest,
  reply: FastifyReply
) => Promise<APIResponse<T>>;