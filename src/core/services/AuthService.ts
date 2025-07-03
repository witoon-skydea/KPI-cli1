import bcrypt from 'bcryptjs';
import { eq, and } from 'drizzle-orm';
import { db } from '../../database/connection.js';
import { users } from '../../database/schema.js';
import type { User, UserRole, CreateUserRequest, JWTPayload } from '../../types/api.js';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  staffId?: number;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  role?: UserRole;
  staffId?: number;
  active?: boolean;
}

export interface LoginResult {
  user: Omit<User, 'passwordHash'>;
  isValid: boolean;
}

export class AuthService {
  async createUser(input: CreateUserInput): Promise<User> {
    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(input.password, saltRounds);

    // Check if user already exists
    const existingUser = await this.findByEmail(input.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const [user] = await db
      .insert(users)
      .values({
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        staffId: input.staffId || null,
        active: true,
      })
      .returning();

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return userWithoutPassword as User;
  }

  async findById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) return null;

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return userWithoutPassword as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) return null;

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return userWithoutPassword as User;
  }

  async findAll(): Promise<User[]> {
    const result = await db
      .select()
      .from(users);

    // Remove password hashes from response
    return result.map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user as any;
      return userWithoutPassword as User;
    });
  }

  async update(id: number, input: UpdateUserInput): Promise<User | null> {
    const [updated] = await db
      .update(users)
      .set({
        ...input,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updated) return null;

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = updated as any;
    return userWithoutPassword as User;
  }

  async delete(id: number): Promise<boolean> {
    // Soft delete by setting active to false
    const [updated] = await db
      .update(users)
      .set({
        active: false,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, id))
      .returning();

    return !!updated;
  }

  async validateLogin(email: string, password: string): Promise<LoginResult> {
    // Get user with password hash
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.email, email),
        eq(users.active, true)
      ))
      .limit(1);

    if (!user) {
      return { user: null as any, isValid: false };
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return { user: null as any, isValid: false };
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return {
      user: userWithoutPassword as User,
      isValid: true
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    // Get user with current password hash
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const [updated] = await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning();

    return !!updated;
  }

  createJWTPayload(user: User): JWTPayload {
    return {
      userId: user.id,
      email: user.email,
      role: user.role
    };
  }

  async findByStaffId(staffId: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.staffId, staffId))
      .limit(1);

    if (!user) return null;

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user as any;
    return userWithoutPassword as User;
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.role, role));

    // Remove password hashes from response
    return result.map(user => {
      const { passwordHash: _, ...userWithoutPassword } = user as any;
      return userWithoutPassword as User;
    });
  }
}