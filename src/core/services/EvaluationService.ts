import { eq, and } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { evaluations, evaluationSummaries } from '../../database/schema.js';
import { DataEntryService } from './DataEntryService.js';
import { KPIService } from './KPIService.js';
import { FormulaEngine } from '../utils/FormulaEngine.js';
import { ScoringEngine } from '../utils/ScoringEngine.js';
import type { Evaluation, EvaluationSummary } from '../../types/index.js';

export interface CreateEvaluationInput {
  staffId: number;
  kpiId: number;
  periodYear: number;
  periodQuarter: number;
}

export class EvaluationService {
  private dataEntryService = new DataEntryService();
  private kpiService = new KPIService();

  async calculateKPIEvaluation(input: CreateEvaluationInput): Promise<Evaluation> {
    const { staffId, kpiId, periodYear, periodQuarter } = input;

    // ดึงข้อมูล KPI
    const kpi = await this.kpiService.findById(kpiId);
    if (!kpi) {
      throw new Error('ไม่พบ KPI ที่ระบุ');
    }

    let calculatedValue: number;
    let score: number;

    // ถ้า KPI มีสูตรคำนวณ
    if (kpi.formulaJson && kpi.rawDataSchemaJson) {
      // ดึงข้อมูล raw data
      const rawData = await this.dataEntryService.findEntry(staffId, kpiId, periodYear, periodQuarter);
      if (!rawData || !rawData.dataValuesJson) {
        throw new Error('ไม่พบข้อมูลสำหรับการคำนวณ KPI');
      }

      // คำนวณค่าจากสูตร
      const context: Record<string, number> = {};
      for (const variable of kpi.formulaJson.variables) {
        const value = rawData.dataValuesJson[variable];
        if (typeof value === 'number') {
          context[variable] = value;
        } else {
          throw new Error(`ไม่พบข้อมูลสำหรับตัวแปร: ${variable}`);
        }
      }

      calculatedValue = FormulaEngine.calculate(kpi.formulaJson, context);
    } else {
      // ถ้าไม่มีสูตร ให้ดึงค่าจาก raw data โดยตรง
      const rawData = await this.dataEntryService.findEntry(staffId, kpiId, periodYear, periodQuarter);
      if (!rawData || !rawData.dataValuesJson) {
        throw new Error('ไม่พบข้อมูลสำหรับการประเมิน KPI');
      }

      // ใช้ค่าแรกที่พบใน dataValues
      const values = Object.values(rawData.dataValuesJson);
      const firstValue = values[0];
      if (typeof firstValue === 'number') {
        calculatedValue = firstValue;
      } else {
        throw new Error('ข้อมูลที่บันทึกไม่ใช่ตัวเลข');
      }
    }

    // คำนวณคะแนน
    if (kpi.scoringCriteriaJson) {
      score = ScoringEngine.calculateScore(calculatedValue, kpi.scoringCriteriaJson);
    } else {
      // ถ้าไม่มีเกณฑ์การให้คะแนน ให้คะแนนตามเปอร์เซ็นต์ของเป้าหมาย
      if (kpi.targetValue) {
        const percentage = (calculatedValue / kpi.targetValue) * 100;
        score = Math.min(5, Math.max(1, Math.round(percentage / 20)));
      } else {
        score = 3; // คะแนนกลางถ้าไม่มีเป้าหมาย
      }
    }

    // ตรวจสอบว่ามีการประเมินแล้วหรือไม่
    const existing = await this.findEvaluation(staffId, kpiId, periodYear, periodQuarter);
    if (existing) {
      // อัปเดตผลการประเมิน
      const [updated] = await db
        .update(evaluations)
        .set({
          calculatedValue,
          score,
          targetValue: kpi.targetValue || null,
          weight: kpi.weight,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(evaluations.id, existing.id))
        .returning();

      return updated as Evaluation;
    } else {
      // สร้างผลการประเมินใหม่
      const [evaluation] = await db
        .insert(evaluations)
        .values({
          staffId,
          kpiId,
          periodYear,
          periodQuarter,
          calculatedValue,
          score,
          targetValue: kpi.targetValue || null,
          weight: kpi.weight,
        })
        .returning();

      return evaluation as Evaluation;
    }
  }

  async findEvaluation(
    staffId: number,
    kpiId: number,
    periodYear: number,
    periodQuarter: number
  ): Promise<Evaluation | null> {
    const [evaluation] = await db
      .select()
      .from(evaluations)
      .where(
        and(
          eq(evaluations.staffId, staffId),
          eq(evaluations.kpiId, kpiId),
          eq(evaluations.periodYear, periodYear),
          eq(evaluations.periodQuarter, periodQuarter)
        )
      )
      .limit(1);

    return evaluation ? (evaluation as Evaluation) : null;
  }

  async getStaffEvaluations(
    staffId: number,
    periodYear?: number,
    periodQuarter?: number
  ): Promise<Evaluation[]> {
    const conditions = [eq(evaluations.staffId, staffId)];
    
    if (periodYear) {
      conditions.push(eq(evaluations.periodYear, periodYear));
    }

    if (periodQuarter) {
      conditions.push(eq(evaluations.periodQuarter, periodQuarter));
    }

    const result = await db
      .select()
      .from(evaluations)
      .where(and(...conditions));
      
    return result as Evaluation[];
  }

  async calculateStaffSummary(
    staffId: number,
    periodYear: number,
    periodQuarter: number
  ): Promise<EvaluationSummary> {
    // ดึงผลการประเมิน KPI ทั้งหมดของพนักงานในช่วงเวลาที่ระบุ
    const staffEvaluations = await this.getStaffEvaluations(staffId, periodYear, periodQuarter);

    if (staffEvaluations.length === 0) {
      throw new Error('ไม่พบผลการประเมิน KPI สำหรับพนักงานในช่วงเวลาที่ระบุ');
    }

    // คำนวณคะแนนถ่วงน้ำหนัก
    const scores = staffEvaluations.map(evaluation => ({
      score: evaluation.score || 0,
      weight: evaluation.weight || 1,
    }));

    const { totalWeightedScore, maxPossibleScore, percentageScore } = 
      ScoringEngine.calculateWeightedScore(scores);

    // กำหนดเกรด
    const grade = ScoringEngine.getGradeFromPercentage(percentageScore);

    // ตรวจสอบว่ามีสรุปผลแล้วหรือไม่
    const existing = await this.findSummary(staffId, periodYear, periodQuarter);
    if (existing) {
      // อัปเดตสรุปผล
      const [updated] = await db
        .update(evaluationSummaries)
        .set({
          totalWeightedScore,
          maxPossibleScore,
          percentageScore,
          grade,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(evaluationSummaries.id, existing.id))
        .returning();

      return updated as EvaluationSummary;
    } else {
      // สร้างสรุปผลใหม่
      const [summary] = await db
        .insert(evaluationSummaries)
        .values({
          staffId,
          periodYear,
          periodQuarter,
          totalWeightedScore,
          maxPossibleScore,
          percentageScore,
          grade,
        })
        .returning();

      return summary as EvaluationSummary;
    }
  }

  async findSummary(
    staffId: number,
    periodYear: number,
    periodQuarter: number
  ): Promise<EvaluationSummary | null> {
    const [summary] = await db
      .select()
      .from(evaluationSummaries)
      .where(
        and(
          eq(evaluationSummaries.staffId, staffId),
          eq(evaluationSummaries.periodYear, periodYear),
          eq(evaluationSummaries.periodQuarter, periodQuarter)
        )
      )
      .limit(1);

    return summary ? (summary as EvaluationSummary) : null;
  }

  async getPeriodEvaluations(periodYear: number, periodQuarter: number): Promise<Evaluation[]> {
    const result = await db
      .select()
      .from(evaluations)
      .where(
        and(
          eq(evaluations.periodYear, periodYear),
          eq(evaluations.periodQuarter, periodQuarter)
        )
      );

    return result as Evaluation[];
  }

  async getPeriodSummaries(periodYear: number, periodQuarter: number): Promise<EvaluationSummary[]> {
    const result = await db
      .select()
      .from(evaluationSummaries)
      .where(
        and(
          eq(evaluationSummaries.periodYear, periodYear),
          eq(evaluationSummaries.periodQuarter, periodQuarter)
        )
      );

    return result as EvaluationSummary[];
  }
}