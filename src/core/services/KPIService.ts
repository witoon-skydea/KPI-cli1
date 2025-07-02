import { eq } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { kpis } from '../../database/schema.js';
import type { KPI, KPIFormula, ScoringCriteria, RawDataSchema } from '../../types/index.js';

export interface CreateKPIInput {
  name: string;
  description?: string;
  formula?: KPIFormula;
  rawDataSchema?: RawDataSchema;
  targetValue?: number;
  scoringCriteria?: ScoringCriteria;
  weight?: number;
}

export interface UpdateKPIInput {
  name?: string;
  description?: string;
  formula?: KPIFormula;
  rawDataSchema?: RawDataSchema;
  targetValue?: number;
  scoringCriteria?: ScoringCriteria;
  weight?: number;
  active?: boolean;
}

export class KPIService {
  async create(input: CreateKPIInput): Promise<KPI> {
    this.validateKPIInput(input);

    const [newKPI] = await db
      .insert(kpis)
      .values({
        name: input.name,
        description: input.description || null,
        formulaJson: input.formula || null,
        rawDataSchemaJson: input.rawDataSchema || null,
        targetValue: input.targetValue || null,
        scoringCriteriaJson: input.scoringCriteria || null,
        weight: input.weight || 1.0,
        active: true,
      })
      .returning();

    return newKPI as KPI;
  }

  async findAll(): Promise<KPI[]> {
    const result = await db.select().from(kpis);
    return result as KPI[];
  }

  async findActive(): Promise<KPI[]> {
    const result = await db
      .select()
      .from(kpis)
      .where(eq(kpis.active, true));
    return result as KPI[];
  }

  async findById(id: number): Promise<KPI | null> {
    const [kpi] = await db
      .select()
      .from(kpis)
      .where(eq(kpis.id, id))
      .limit(1);

    return kpi ? (kpi as KPI) : null;
  }

  async findByName(name: string): Promise<KPI | null> {
    const [kpi] = await db
      .select()
      .from(kpis)
      .where(eq(kpis.name, name))
      .limit(1);

    return kpi ? (kpi as KPI) : null;
  }

  async update(id: number, input: UpdateKPIInput): Promise<KPI | null> {
    if (input.formula || input.rawDataSchema || input.scoringCriteria) {
      this.validateKPIInput(input);
    }

    const updateData: Partial<typeof kpis.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description || null;
    if (input.formula !== undefined) updateData.formulaJson = input.formula || null;
    if (input.rawDataSchema !== undefined) updateData.rawDataSchemaJson = input.rawDataSchema || null;
    if (input.targetValue !== undefined) updateData.targetValue = input.targetValue || null;
    if (input.scoringCriteria !== undefined) updateData.scoringCriteriaJson = input.scoringCriteria || null;
    if (input.weight !== undefined) updateData.weight = input.weight;
    if (input.active !== undefined) updateData.active = input.active;
    
    updateData.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(kpis)
      .set(updateData)
      .where(eq(kpis.id, id))
      .returning();

    return updated ? (updated as KPI) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(kpis)
      .where(eq(kpis.id, id));

    return result.changes > 0;
  }

  async setActive(id: number, active: boolean): Promise<KPI | null> {
    const [updated] = await db
      .update(kpis)
      .set({ 
        active, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(kpis.id, id))
      .returning();

    return updated ? (updated as KPI) : null;
  }

  validateScoringCriteria(criteria: ScoringCriteria): void {
    if (!criteria.ranges || !Array.isArray(criteria.ranges)) {
      throw new Error('Scoring criteria must have a ranges array');
    }

    if (criteria.ranges.length === 0) {
      throw new Error('Scoring criteria must have at least one range');
    }

    const sortedRanges = [...criteria.ranges].sort((a, b) => a.min - b.min);
    
    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      if (!range) continue;
      
      if (typeof range.min !== 'number' || typeof range.max !== 'number' || typeof range.score !== 'number') {
        throw new Error('Each range must have numeric min, max, and score values');
      }
      
      if (range.min >= range.max) {
        throw new Error(`Range ${i + 1}: min value must be less than max value`);
      }
      
      if (range.score < 1 || range.score > 5 || !Number.isInteger(range.score)) {
        throw new Error(`Range ${i + 1}: score must be an integer between 1 and 5`);
      }
      
      const prevRange = sortedRanges[i - 1];
      if (i > 0 && prevRange && prevRange.max > range.min) {
        throw new Error(`Range ${i + 1}: overlaps with previous range`);
      }
    }
  }

  validateRawDataSchema(schema: RawDataSchema): void {
    if (!schema.fields || !Array.isArray(schema.fields)) {
      throw new Error('Raw data schema must have a fields array');
    }

    if (schema.fields.length === 0) {
      throw new Error('Raw data schema must have at least one field');
    }

    const fieldNames = new Set<string>();
    
    for (let i = 0; i < schema.fields.length; i++) {
      const field = schema.fields[i];
      if (!field) continue;
      
      if (!field.name || typeof field.name !== 'string') {
        throw new Error(`Field ${i + 1}: name is required and must be a string`);
      }
      
      if (fieldNames.has(field.name)) {
        throw new Error(`Field ${i + 1}: duplicate field name "${field.name}"`);
      }
      fieldNames.add(field.name);
      
      if (!['number', 'string', 'date'].includes(field.type)) {
        throw new Error(`Field ${i + 1}: type must be 'number', 'string', or 'date'`);
      }
      
      if (typeof field.required !== 'boolean') {
        throw new Error(`Field ${i + 1}: required must be a boolean`);
      }
    }
  }

  validateFormula(formula: KPIFormula): void {
    if (!formula.type || !['arithmetic', 'function'].includes(formula.type)) {
      throw new Error('Formula type must be "arithmetic" or "function"');
    }
    
    if (!formula.expression || typeof formula.expression !== 'string') {
      throw new Error('Formula expression is required and must be a string');
    }
    
    if (!formula.variables || !Array.isArray(formula.variables)) {
      throw new Error('Formula variables must be an array');
    }
    
    const variableSet = new Set(formula.variables);
    if (variableSet.size !== formula.variables.length) {
      throw new Error('Formula variables must be unique');
    }
  }

  private validateKPIInput(input: CreateKPIInput | UpdateKPIInput): void {
    if ('name' in input && input.name !== undefined) {
      if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
        throw new Error('KPI name is required and must be a non-empty string');
      }
    }

    if (input.weight !== undefined) {
      if (typeof input.weight !== 'number' || input.weight <= 0) {
        throw new Error('KPI weight must be a positive number');
      }
    }

    if (input.targetValue !== undefined && input.targetValue !== null) {
      if (typeof input.targetValue !== 'number') {
        throw new Error('KPI target value must be a number');
      }
    }

    if (input.formula) {
      this.validateFormula(input.formula);
    }

    if (input.rawDataSchema) {
      this.validateRawDataSchema(input.rawDataSchema);
    }

    if (input.scoringCriteria) {
      this.validateScoringCriteria(input.scoringCriteria);
    }

    if (input.formula && input.rawDataSchema) {
      const schemaFields = new Set(input.rawDataSchema.fields.map(f => f.name));
      const formulaVariables = new Set(input.formula.variables);
      
      for (const variable of formulaVariables) {
        if (!schemaFields.has(variable)) {
          throw new Error(`Formula variable "${variable}" not found in raw data schema`);
        }
      }
    }
  }
}