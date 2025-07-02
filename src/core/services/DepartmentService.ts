import { eq } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { departments } from '../../database/schema.js';
import type { Department } from '../../types/index.js';

export interface CreateDepartmentInput {
  name: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
}

export class DepartmentService {
  async create(input: CreateDepartmentInput): Promise<Department> {
    const [department] = await db
      .insert(departments)
      .values({
        name: input.name,
        description: input.description || null,
      })
      .returning();

    return department as Department;
  }

  async findAll(): Promise<Department[]> {
    const result = await db.select().from(departments);
    return result as Department[];
  }

  async findById(id: number): Promise<Department | null> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, id));

    return department ? (department as Department) : null;
  }

  async update(id: number, input: UpdateDepartmentInput): Promise<Department | null> {
    const updateData: Partial<typeof departments.$inferInsert> = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description || null;
    
    updateData.updatedAt = new Date().toISOString();

    const [updated] = await db
      .update(departments)
      .set(updateData)
      .where(eq(departments.id, id))
      .returning();

    return updated ? (updated as Department) : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(departments)
      .where(eq(departments.id, id));

    return result.changes > 0;
  }

  async findByName(name: string): Promise<Department | null> {
    const [department] = await db
      .select()
      .from(departments)
      .where(eq(departments.name, name));

    return department ? (department as Department) : null;
  }
}