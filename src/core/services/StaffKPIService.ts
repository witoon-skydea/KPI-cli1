import { eq, and } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { staffKpis, staff, kpis } from '../../database/schema.js';
import type { StaffKPI } from '../../types/index.js';

export interface AssignKPIInput {
  staffId: number;
  kpiId: number;
  assignedDate?: string;
}

export interface StaffKPIWithDetails extends StaffKPI {
  staffName?: string;
  kpiName?: string;
  kpiWeight?: number;
}

export class StaffKPIService {
  async assignKPI(input: AssignKPIInput): Promise<StaffKPI> {
    // ตรวจสอบว่าได้มอบหมายแล้วหรือยัง
    const existing = await this.findAssignment(input.staffId, input.kpiId);
    if (existing && existing.active) {
      throw new Error('KPI นี้ได้รับการมอบหมายให้พนักงานคนนี้แล้ว');
    }

    const [assignment] = await db
      .insert(staffKpis)
      .values({
        staffId: input.staffId,
        kpiId: input.kpiId,
        assignedDate: input.assignedDate || new Date().toISOString(),
        active: true,
      })
      .returning();

    return assignment as StaffKPI;
  }

  async findAssignment(staffId: number, kpiId: number): Promise<StaffKPI | null> {
    const [assignment] = await db
      .select()
      .from(staffKpis)
      .where(
        and(
          eq(staffKpis.staffId, staffId),
          eq(staffKpis.kpiId, kpiId)
        )
      )
      .limit(1);

    return assignment ? (assignment as StaffKPI) : null;
  }

  async getStaffKPIs(staffId: number): Promise<StaffKPIWithDetails[]> {
    const result = await db
      .select({
        id: staffKpis.id,
        staffId: staffKpis.staffId,
        kpiId: staffKpis.kpiId,
        assignedDate: staffKpis.assignedDate,
        active: staffKpis.active,
        createdAt: staffKpis.createdAt,
        updatedAt: staffKpis.updatedAt,
        staffName: staff.name,
        kpiName: kpis.name,
        kpiWeight: kpis.weight,
      })
      .from(staffKpis)
      .leftJoin(staff, eq(staffKpis.staffId, staff.id))
      .leftJoin(kpis, eq(staffKpis.kpiId, kpis.id))
      .where(eq(staffKpis.staffId, staffId));

    return result as StaffKPIWithDetails[];
  }

  async getKPIStaff(kpiId: number): Promise<StaffKPIWithDetails[]> {
    const result = await db
      .select({
        id: staffKpis.id,
        staffId: staffKpis.staffId,
        kpiId: staffKpis.kpiId,
        assignedDate: staffKpis.assignedDate,
        active: staffKpis.active,
        createdAt: staffKpis.createdAt,
        updatedAt: staffKpis.updatedAt,
        staffName: staff.name,
        kpiName: kpis.name,
        kpiWeight: kpis.weight,
      })
      .from(staffKpis)
      .leftJoin(staff, eq(staffKpis.staffId, staff.id))
      .leftJoin(kpis, eq(staffKpis.kpiId, kpis.id))
      .where(eq(staffKpis.kpiId, kpiId));

    return result as StaffKPIWithDetails[];
  }

  async removeAssignment(staffId: number, kpiId: number): Promise<boolean> {
    const [updated] = await db
      .update(staffKpis)
      .set({ 
        active: false,
        updatedAt: new Date().toISOString() 
      })
      .where(
        and(
          eq(staffKpis.staffId, staffId),
          eq(staffKpis.kpiId, kpiId)
        )
      )
      .returning();

    return !!updated;
  }

  async getActiveAssignments(): Promise<StaffKPIWithDetails[]> {
    const result = await db
      .select({
        id: staffKpis.id,
        staffId: staffKpis.staffId,
        kpiId: staffKpis.kpiId,
        assignedDate: staffKpis.assignedDate,
        active: staffKpis.active,
        createdAt: staffKpis.createdAt,
        updatedAt: staffKpis.updatedAt,
        staffName: staff.name,
        kpiName: kpis.name,
        kpiWeight: kpis.weight,
      })
      .from(staffKpis)
      .leftJoin(staff, eq(staffKpis.staffId, staff.id))
      .leftJoin(kpis, eq(staffKpis.kpiId, kpis.id))
      .where(eq(staffKpis.active, true));

    return result as StaffKPIWithDetails[];
  }
}