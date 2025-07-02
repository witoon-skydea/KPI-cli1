import { eq } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { staff, departments } from '../../database/schema.js';
import type { Staff } from '../../types/index.js';

export interface CreateStaffInput {
  employeeId: string;
  name: string;
  email: string;
  departmentId?: number;
  position?: string;
  hireDate?: string;
}

export interface UpdateStaffInput {
  employeeId?: string;
  name?: string;
  email?: string;
  departmentId?: number;
  position?: string;
  hireDate?: string;
  active?: boolean;
}

export interface StaffWithDepartment extends Staff {
  departmentName?: string;
}

export class StaffService {
  async create(input: CreateStaffInput): Promise<Staff> {
    if (input.departmentId) {
      const department = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.departmentId))
        .limit(1);
      
      if (department.length === 0) {
        throw new Error(`Department with ID ${input.departmentId} not found`);
      }
    }

    const [newStaff] = await db
      .insert(staff)
      .values({
        employeeId: input.employeeId,
        name: input.name,
        email: input.email,
        departmentId: input.departmentId || null,
        position: input.position || null,
        hireDate: input.hireDate || null,
        active: true,
      })
      .returning();

    return newStaff as Staff;
  }

  async findAll(): Promise<StaffWithDepartment[]> {
    const result = await db
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        email: staff.email,
        departmentId: staff.departmentId,
        position: staff.position,
        hireDate: staff.hireDate,
        active: staff.active,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        departmentName: departments.name,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id));

    return result.map(row => ({
      ...row,
      departmentName: row.departmentName || undefined,
    })) as StaffWithDepartment[];
  }

  async findById(id: number): Promise<StaffWithDepartment | null> {
    const result = await db
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        email: staff.email,
        departmentId: staff.departmentId,
        position: staff.position,
        hireDate: staff.hireDate,
        active: staff.active,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        departmentName: departments.name,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(eq(staff.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const row = result[0];
    if (!row) return null;
    
    return {
      ...row,
      departmentName: row.departmentName || undefined,
    } as StaffWithDepartment;
  }

  async findByEmployeeId(employeeId: string): Promise<Staff | null> {
    const [result] = await db
      .select()
      .from(staff)
      .where(eq(staff.employeeId, employeeId))
      .limit(1);

    return result ? (result as Staff) : null;
  }

  async findByEmail(email: string): Promise<Staff | null> {
    const [result] = await db
      .select()
      .from(staff)
      .where(eq(staff.email, email))
      .limit(1);

    return result ? (result as Staff) : null;
  }

  async findByDepartment(departmentId: number): Promise<StaffWithDepartment[]> {
    const result = await db
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        email: staff.email,
        departmentId: staff.departmentId,
        position: staff.position,
        hireDate: staff.hireDate,
        active: staff.active,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        departmentName: departments.name,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(eq(staff.departmentId, departmentId));

    return result.map(row => ({
      ...row,
      departmentName: row.departmentName || undefined,
    })) as StaffWithDepartment[];
  }

  async update(id: number, input: UpdateStaffInput): Promise<Staff | null> {
    if (input.departmentId) {
      const department = await db
        .select()
        .from(departments)
        .where(eq(departments.id, input.departmentId))
        .limit(1);
      
      if (department.length === 0) {
        throw new Error(`Department with ID ${input.departmentId} not found`);
      }
    }

    const updateData: Partial<typeof staff.$inferInsert> = {};
    
    if (input.employeeId !== undefined) updateData.employeeId = input.employeeId;
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.departmentId !== undefined) updateData.departmentId = input.departmentId || null;
    if (input.position !== undefined) updateData.position = input.position || null;
    if (input.hireDate !== undefined) updateData.hireDate = input.hireDate || null;
    if (input.active !== undefined) updateData.active = input.active;
    
    updateData.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(staff)
      .set(updateData)
      .where(eq(staff.id, id))
      .returning();

    return updated ? (updated as Staff) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(staff)
      .where(eq(staff.id, id));

    return result.changes > 0;
  }

  async setActive(id: number, active: boolean): Promise<Staff | null> {
    const [updated] = await db
      .update(staff)
      .set({ 
        active, 
        updatedAt: new Date().toISOString() 
      })
      .where(eq(staff.id, id))
      .returning();

    return updated ? (updated as Staff) : null;
  }

  async findActiveStaff(): Promise<StaffWithDepartment[]> {
    const result = await db
      .select({
        id: staff.id,
        employeeId: staff.employeeId,
        name: staff.name,
        email: staff.email,
        departmentId: staff.departmentId,
        position: staff.position,
        hireDate: staff.hireDate,
        active: staff.active,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        departmentName: departments.name,
      })
      .from(staff)
      .leftJoin(departments, eq(staff.departmentId, departments.id))
      .where(eq(staff.active, true));

    return result.map(row => ({
      ...row,
      departmentName: row.departmentName || undefined,
    })) as StaffWithDepartment[];
  }
}