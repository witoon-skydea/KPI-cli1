import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20')
});

// Common query parameters
export const querySchema = paginationSchema.extend({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional()
});

// ID parameter schema
export const idParamSchema = z.object({
  id: z.string().transform(Number).pipe(z.number().min(1))
});

// Department schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(255),
  description: z.string().max(1000).optional()
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const departmentQuerySchema = querySchema.extend({
  active: z.string().transform(Boolean).optional()
});

// Staff schemas - Zod for validation
export const createStaffZodSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(50),
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Valid email is required'),
  departmentId: z.number().optional(),
  position: z.string().max(255).optional(),
  hireDate: z.string().optional(),
  active: z.boolean().default(true)
});

export const updateStaffZodSchema = createStaffZodSchema.partial();

// Staff schemas - JSON for Fastify
export const createStaffSchema = zodToJsonSchema(createStaffZodSchema);
export const updateStaffSchema = zodToJsonSchema(updateStaffZodSchema);

export const staffQuerySchema = querySchema.extend({
  departmentId: z.string().transform(Number).optional(),
  active: z.string().transform(Boolean).optional(),
  position: z.string().optional()
});

// KPI schemas
export const kpiFormulaSchema = z.object({
  type: z.enum(['arithmetic', 'function']),
  expression: z.string().min(1),
  variables: z.array(z.string())
});

export const scoringRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  score: z.number().min(1).max(5)
});

export const scoringCriteriaSchema = z.object({
  ranges: z.array(scoringRangeSchema)
});

export const rawDataFieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['number', 'string', 'date']),
  required: z.boolean(),
  description: z.string().optional(),
  label: z.string().optional()
});

export const rawDataSchemaSchema = z.object({
  fields: z.array(rawDataFieldSchema)
});

export const createKPISchema = z.object({
  name: z.string().min(1, 'KPI name is required').max(255),
  description: z.string().max(1000).optional(),
  formulaJson: kpiFormulaSchema.optional(),
  rawDataSchemaJson: rawDataSchemaSchema.optional(),
  targetValue: z.number().optional(),
  scoringCriteriaJson: scoringCriteriaSchema.optional(),
  weight: z.number().default(1),
  active: z.boolean().default(true)
});

export const updateKPISchema = createKPISchema.partial();

export const kpiQuerySchema = querySchema.extend({
  active: z.string().transform(Boolean).optional(),
  weight: z.string().transform(Number).optional()
});

export const testFormulaSchema = z.object({
  variables: z.record(z.string(), z.number())
});

// Data entry schemas
export const createDataEntrySchema = z.object({
  staffId: z.number(),
  kpiId: z.number(),
  periodYear: z.number(),
  periodQuarter: z.number(),
  dataValues: z.record(z.string(), z.unknown())
});

export const updateDataEntrySchema = z.object({
  dataValues: z.record(z.string(), z.unknown())
});

export const dataEntryQuerySchema = querySchema.extend({
  staffId: z.string().transform(Number).optional(),
  kpiId: z.string().transform(Number).optional(),
  departmentId: z.string().transform(Number).optional(),
  year: z.string().transform(Number).optional(),
  quarter: z.string().transform(Number).optional()
});

// Assignment schemas
export const assignmentSchema = z.object({
  staffId: z.number(),
  kpiId: z.number(),
  assignedDate: z.string().optional()
});

export const bulkAssignmentSchema = z.object({
  assignments: z.array(assignmentSchema)
});

// Report schemas
export const reportQuerySchema = z.object({
  departmentId: z.string().transform(Number).optional(),
  year: z.string().transform(Number).optional(),
  quarter: z.string().transform(Number).optional(),
  format: z.enum(['json', 'pdf', 'excel']).default('json')
});

// Types derived from schemas
export type CreateDepartmentRequest = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentRequest = z.infer<typeof updateDepartmentSchema>;
export type DepartmentQueryParams = z.infer<typeof departmentQuerySchema>;

export type CreateStaffRequest = z.infer<typeof createStaffZodSchema>;
export type UpdateStaffRequest = z.infer<typeof updateStaffZodSchema>;
export type StaffQueryParams = z.infer<typeof staffQuerySchema>;

export type CreateKPIRequest = z.infer<typeof createKPISchema>;
export type UpdateKPIRequest = z.infer<typeof updateKPISchema>;
export type KPIQueryParams = z.infer<typeof kpiQuerySchema>;
export type TestFormulaRequest = z.infer<typeof testFormulaSchema>;

export type CreateDataEntryRequest = z.infer<typeof createDataEntrySchema>;
export type UpdateDataEntryRequest = z.infer<typeof updateDataEntrySchema>;
export type DataEntryQueryParams = z.infer<typeof dataEntryQuerySchema>;

export type AssignmentRequest = z.infer<typeof assignmentSchema>;
export type BulkAssignmentRequest = z.infer<typeof bulkAssignmentSchema>;

export type ReportQueryParams = z.infer<typeof reportQuerySchema>;
export type PaginationParams = z.infer<typeof paginationSchema>;
export type QueryParams = z.infer<typeof querySchema>;
export type IdParams = z.infer<typeof idParamSchema>;