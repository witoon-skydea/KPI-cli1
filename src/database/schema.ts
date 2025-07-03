import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'admin', 'manager', 'employee'
  staffId: integer('staff_id').references(() => staff.id),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const departments = sqliteTable('departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const staff = sqliteTable('staff', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeId: text('employee_id').notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  departmentId: integer('department_id').references(() => departments.id),
  position: text('position'),
  hireDate: text('hire_date'),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const kpis = sqliteTable('kpis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  formulaJson: text('formula_json', { mode: 'json' }),
  rawDataSchemaJson: text('raw_data_schema_json', { mode: 'json' }),
  targetValue: real('target_value'),
  scoringCriteriaJson: text('scoring_criteria_json', { mode: 'json' }),
  weight: real('weight').default(1.0),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const staffKpis = sqliteTable('staff_kpis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  kpiId: integer('kpi_id').references(() => kpis.id).notNull(),
  assignedDate: text('assigned_date').default(sql`CURRENT_TIMESTAMP`),
  active: integer('active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const rawDataEntries = sqliteTable('raw_data_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  kpiId: integer('kpi_id').references(() => kpis.id).notNull(),
  periodYear: integer('period_year').notNull(),
  periodQuarter: integer('period_quarter').notNull(),
  dataValuesJson: text('data_values_json', { mode: 'json' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const evaluations = sqliteTable('evaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  kpiId: integer('kpi_id').references(() => kpis.id).notNull(),
  periodYear: integer('period_year').notNull(),
  periodQuarter: integer('period_quarter').notNull(),
  calculatedValue: real('calculated_value'),
  score: integer('score'),
  targetValue: real('target_value'),
  weight: real('weight'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const evaluationSummaries = sqliteTable('evaluation_summaries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  staffId: integer('staff_id').references(() => staff.id).notNull(),
  periodYear: integer('period_year').notNull(),
  periodQuarter: integer('period_quarter').notNull(),
  totalWeightedScore: real('total_weighted_score'),
  maxPossibleScore: real('max_possible_score'),
  percentageScore: real('percentage_score'),
  grade: text('grade'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});