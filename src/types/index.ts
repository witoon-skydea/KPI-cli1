export interface Department {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  departmentId?: number;
  position?: string;
  hireDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KPIFormula {
  type: 'arithmetic' | 'function';
  expression: string;
  variables: string[];
}

export interface ScoringRange {
  min: number;
  max: number;
  score: number;
}

export interface ScoringCriteria {
  ranges: ScoringRange[];
}

export interface RawDataSchema {
  fields: {
    name: string;
    type: 'number' | 'string' | 'date';
    required: boolean;
    description?: string;
  }[];
}

export interface KPI {
  id: number;
  name: string;
  description?: string;
  formulaJson?: KPIFormula;
  rawDataSchemaJson?: RawDataSchema;
  targetValue?: number;
  scoringCriteriaJson?: ScoringCriteria;
  weight: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffKPI {
  id: number;
  staffId: number;
  kpiId: number;
  assignedDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RawDataEntry {
  id: number;
  staffId: number;
  kpiId: number;
  periodYear: number;
  periodQuarter: number;
  dataValuesJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: number;
  staffId: number;
  kpiId: number;
  periodYear: number;
  periodQuarter: number;
  calculatedValue?: number;
  score?: number;
  targetValue?: number;
  weight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationSummary {
  id: number;
  staffId: number;
  periodYear: number;
  periodQuarter: number;
  totalWeightedScore?: number;
  maxPossibleScore?: number;
  percentageScore?: number;
  grade?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  year: number;
  quarter: number;
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';