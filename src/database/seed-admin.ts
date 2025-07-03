import bcrypt from 'bcryptjs';
import { db } from './connection.js';
import { users } from './schema.js';

async function seedAdmin() {
  console.log('Seeding admin user...');
  
  try {
    // Hash the default password
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    // Insert admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        email: 'admin@kpi.local',
        passwordHash,
        name: 'Admin User',
        role: 'admin',
        active: true,
      })
      .onConflictDoNothing()
      .returning();

    if (adminUser) {
      console.log('✅ Admin user created successfully');
      console.log('Email: admin@kpi.local');
      console.log('Password: admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
}

seedAdmin();