import { eq, and } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { rawDataEntries } from '../../database/schema.js';
import type { RawDataEntry } from '../../types/index.js';

export interface CreateRawDataInput {
  staffId: number;
  kpiId: number;
  periodYear: number;
  periodQuarter: number;
  dataValues: Record<string, unknown>;
}

export interface UpdateRawDataInput {
  dataValues: Record<string, unknown>;
}

export class DataEntryService {
  async createEntry(input: CreateRawDataInput): Promise<RawDataEntry> {
    // ตรวจสอบว่ามีข้อมูลในช่วงเวลานี้แล้วหรือไม่
    const existing = await this.findEntry(
      input.staffId,
      input.kpiId,
      input.periodYear,
      input.periodQuarter
    );

    if (existing) {
      throw new Error(`มีการบันทึกข้อมูลสำหรับ KPI นี้ในไตรมาส ${input.periodQuarter}/${input.periodYear} แล้ว`);
    }

    const [entry] = await db
      .insert(rawDataEntries)
      .values({
        staffId: input.staffId,
        kpiId: input.kpiId,
        periodYear: input.periodYear,
        periodQuarter: input.periodQuarter,
        dataValuesJson: input.dataValues,
      })
      .returning();

    return entry as RawDataEntry;
  }

  async updateEntry(
    staffId: number,
    kpiId: number,
    periodYear: number,
    periodQuarter: number,
    input: UpdateRawDataInput
  ): Promise<RawDataEntry | null> {
    const [updated] = await db
      .update(rawDataEntries)
      .set({
        dataValuesJson: input.dataValues,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(rawDataEntries.staffId, staffId),
          eq(rawDataEntries.kpiId, kpiId),
          eq(rawDataEntries.periodYear, periodYear),
          eq(rawDataEntries.periodQuarter, periodQuarter)
        )
      )
      .returning();

    return updated ? (updated as RawDataEntry) : null;
  }

  async findEntry(
    staffId: number,
    kpiId: number,
    periodYear: number,
    periodQuarter: number
  ): Promise<RawDataEntry | null> {
    const [entry] = await db
      .select()
      .from(rawDataEntries)
      .where(
        and(
          eq(rawDataEntries.staffId, staffId),
          eq(rawDataEntries.kpiId, kpiId),
          eq(rawDataEntries.periodYear, periodYear),
          eq(rawDataEntries.periodQuarter, periodQuarter)
        )
      )
      .limit(1);

    return entry ? (entry as RawDataEntry) : null;
  }

  async getStaffEntries(
    staffId: number,
    periodYear?: number,
    periodQuarter?: number
  ): Promise<RawDataEntry[]> {
    const conditions = [eq(rawDataEntries.staffId, staffId)];
    
    if (periodYear) {
      conditions.push(eq(rawDataEntries.periodYear, periodYear));
    }

    if (periodQuarter) {
      conditions.push(eq(rawDataEntries.periodQuarter, periodQuarter));
    }

    const result = await db
      .select()
      .from(rawDataEntries)
      .where(and(...conditions));
      
    return result as RawDataEntry[];
  }

  async getKPIEntries(
    kpiId: number,
    periodYear?: number,
    periodQuarter?: number
  ): Promise<RawDataEntry[]> {
    const conditions = [eq(rawDataEntries.kpiId, kpiId)];
    
    if (periodYear) {
      conditions.push(eq(rawDataEntries.periodYear, periodYear));
    }

    if (periodQuarter) {
      conditions.push(eq(rawDataEntries.periodQuarter, periodQuarter));
    }

    const result = await db
      .select()
      .from(rawDataEntries)
      .where(and(...conditions));
      
    return result as RawDataEntry[];
  }

  async getPeriodEntries(periodYear: number, periodQuarter: number): Promise<RawDataEntry[]> {
    const result = await db
      .select()
      .from(rawDataEntries)
      .where(
        and(
          eq(rawDataEntries.periodYear, periodYear),
          eq(rawDataEntries.periodQuarter, periodQuarter)
        )
      );

    return result as RawDataEntry[];
  }

  async deleteEntry(
    staffId: number,
    kpiId: number,
    periodYear: number,
    periodQuarter: number
  ): Promise<boolean> {
    const result = await db
      .delete(rawDataEntries)
      .where(
        and(
          eq(rawDataEntries.staffId, staffId),
          eq(rawDataEntries.kpiId, kpiId),
          eq(rawDataEntries.periodYear, periodYear),
          eq(rawDataEntries.periodQuarter, periodQuarter)
        )
      );

    return result.changes > 0;
  }
}