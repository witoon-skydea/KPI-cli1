import { DepartmentService } from '../core/services/DepartmentService.js';
import { StaffService } from '../core/services/StaffService.js';
import { KPIService } from '../core/services/KPIService.js';
import { ScoringEngine } from '../core/utils/ScoringEngine.js';
import { closeDatabase } from './connection.js';

async function seedDatabase(): Promise<void> {
  console.log('Seeding database with sample data...');
  
  try {
    const departmentService = new DepartmentService();
    const staffService = new StaffService();
    const kpiService = new KPIService();

    // Create sample departments
    const engineering = await departmentService.create({
      name: 'Engineering',
      description: 'Software development and technical teams'
    });

    const sales = await departmentService.create({
      name: 'Sales',
      description: 'Sales and business development'
    });

    const marketing = await departmentService.create({
      name: 'Marketing',
      description: 'Marketing and brand management'
    });

    console.log('✅ Sample departments created:');
    console.log(`  - ${engineering.name} (ID: ${engineering.id})`);
    console.log(`  - ${sales.name} (ID: ${sales.id})`);
    console.log(`  - ${marketing.name} (ID: ${marketing.id})`);

    // Create sample staff
    const johnDoe = await staffService.create({
      employeeId: 'ENG001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      departmentId: engineering.id,
      position: 'Senior Software Engineer',
      hireDate: '2023-01-15'
    });

    const janeSmith = await staffService.create({
      employeeId: 'SAL001',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      departmentId: sales.id,
      position: 'Sales Manager',
      hireDate: '2022-06-01'
    });

    const bobJohnson = await staffService.create({
      employeeId: 'MKT001',
      name: 'Bob Johnson',
      email: 'bob.johnson@company.com',
      departmentId: marketing.id,
      position: 'Marketing Specialist',
      hireDate: '2023-03-10'
    });

    console.log('✅ Sample staff created:');
    console.log(`  - ${johnDoe.name} (${johnDoe.employeeId})`);
    console.log(`  - ${janeSmith.name} (${janeSmith.employeeId})`);
    console.log(`  - ${bobJohnson.name} (${bobJohnson.employeeId})`);

    // Create sample KPIs
    const salesKPI = await kpiService.create({
      name: 'Monthly Sales Revenue',
      description: 'Total sales revenue generated per month',
      weight: 2.0,
      targetValue: 100000,
      scoringCriteria: ScoringEngine.createLinearScoringCriteria(50000, 150000)
    });

    const bugFixKPI = await kpiService.create({
      name: 'Bug Resolution Rate',
      description: 'Percentage of bugs resolved within SLA',
      weight: 1.5,
      targetValue: 95,
      scoringCriteria: ScoringEngine.createPercentageScoringCriteria()
    });

    const leadGenKPI = await kpiService.create({
      name: 'Lead Generation',
      description: 'Number of qualified leads generated per month',
      weight: 1.0,
      targetValue: 50,
      formula: {
        type: 'arithmetic',
        expression: 'website_leads + social_leads + email_leads',
        variables: ['website_leads', 'social_leads', 'email_leads']
      },
      rawDataSchema: {
        fields: [
          { name: 'website_leads', type: 'number', required: true, description: 'Leads from website forms' },
          { name: 'social_leads', type: 'number', required: true, description: 'Leads from social media' },
          { name: 'email_leads', type: 'number', required: true, description: 'Leads from email campaigns' }
        ]
      },
      scoringCriteria: ScoringEngine.createLinearScoringCriteria(20, 80)
    });

    console.log('✅ Sample KPIs created:');
    console.log(`  - ${salesKPI.name} (Weight: ${salesKPI.weight})`);
    console.log(`  - ${bugFixKPI.name} (Weight: ${bugFixKPI.weight})`);
    console.log(`  - ${leadGenKPI.name} (Weight: ${leadGenKPI.weight})`);
    
    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

seedDatabase();