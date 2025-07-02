import { DepartmentService } from '../core/services/DepartmentService.js';
import { StaffService } from '../core/services/StaffService.js';
import { KPIService } from '../core/services/KPIService.js';
import { ScoringEngine } from '../core/utils/ScoringEngine.js';
import { closeDatabase } from './connection.js';

async function createAccountingDemo(): Promise<void> {
  console.log('สร้างข้อมูล Demo สำหรับแผนกบัญชีองค์กรขนาดเล็ก...\n');
  
  try {
    const departmentService = new DepartmentService();
    const staffService = new StaffService();
    const kpiService = new KPIService();

    // สร้างแผนกบัญชี
    const accounting = await departmentService.create({
      name: 'แผนกบัญชีและการเงิน',
      description: 'รับผิดชอบงานบัญชี การเงิน และการควบคุมต้นทุน'
    });

    console.log('✅ สร้างแผนกบัญชีแล้ว');

    // สร้างพนักงานในแผนกบัญชี
    const accountingManager = await staffService.create({
      employeeId: 'ACC001',
      name: 'คุณสมใจ วิเชียรชาญ',
      email: 'somjai.w@company.co.th',
      departmentId: accounting.id,
      position: 'ผู้จัดการแผนกบัญชี',
      hireDate: '2022-03-01'
    });

    const seniorAccountant = await staffService.create({
      employeeId: 'ACC002',
      name: 'คุณนิภา สุขสบาย',
      email: 'nipa.s@company.co.th',
      departmentId: accounting.id,
      position: 'นักบัญชีอาวุโส',
      hireDate: '2022-08-15'
    });

    const juniorAccountant = await staffService.create({
      employeeId: 'ACC003',
      name: 'คุณธีรพงษ์ เก่งการเงิน',
      email: 'teerapong.k@company.co.th',
      departmentId: accounting.id,
      position: 'นักบัญชีเจนิเออร์',
      hireDate: '2023-01-10'
    });

    console.log('✅ สร้างพนักงาน 3 คน:');
    console.log(`  - ${accountingManager.name} (${accountingManager.position})`);
    console.log(`  - ${seniorAccountant.name} (${seniorAccountant.position})`);
    console.log(`  - ${juniorAccountant.name} (${juniorAccountant.position})`);

    // สร้าง KPI สำหรับแผนกบัญชี
    
    // 1. KPI สำหรับความแม่นยำของรายงานการเงิน
    const accuracyKPI = await kpiService.create({
      name: 'ความแม่นยำของรายงานการเงิน',
      description: 'เปอร์เซ็นต์ความถูกต้องของรายงานการเงินรายเดือน (ไม่มีข้อผิดพลาด)',
      weight: 2.0,
      targetValue: 98,
      scoringCriteria: {
        ranges: [
          { min: 0, max: 85, score: 1 },
          { min: 85.01, max: 92, score: 2 },
          { min: 92.01, max: 96, score: 3 },
          { min: 96.01, max: 98, score: 4 },
          { min: 98.01, max: 100, score: 5 }
        ]
      }
    });

    // 2. KPI สำหรับการปิดบัญชีตามเวลา
    const timelinessKPI = await kpiService.create({
      name: 'การปิดบัญชีตามกำหนดเวลา',
      description: 'จำนวนวันที่ใช้ในการปิดบัญชีรายเดือน (เป้าหมาย 5 วันทำการ)',
      weight: 1.5,
      targetValue: 5,
      scoringCriteria: ScoringEngine.createInverseScoringCriteria(3, 10) // น้อยกว่าดีกว่า
    });

    // 3. KPI สำหรับการควบคุมค่าใช้จ่าย
    const costControlKPI = await kpiService.create({
      name: 'การควบคุมค่าใช้จ่ายแผนก',
      description: 'เปอร์เซ็นต์การประหยัดต้นทุนเทียบกับงบประมาณที่กำหนด',
      weight: 1.5,
      targetValue: 5,
      formula: {
        type: 'arithmetic',
        expression: '((budget - actual_cost) / budget) * 100',
        variables: ['budget', 'actual_cost']
      },
      rawDataSchema: {
        fields: [
          { name: 'budget', type: 'number', required: true, description: 'งบประมาณที่กำหนด (บาท)' },
          { name: 'actual_cost', type: 'number', required: true, description: 'ค่าใช้จ่ายจริง (บาท)' }
        ]
      },
      scoringCriteria: {
        ranges: [
          { min: -5, max: 0, score: 1 },
          { min: 0.01, max: 2, score: 2 },
          { min: 2.01, max: 4, score: 3 },
          { min: 4.01, max: 7, score: 4 },
          { min: 7.01, max: 15, score: 5 }
        ]
      }
    });

    // 4. KPI สำหรับการจัดเก็บเอกสาร
    const documentKPI = await kpiService.create({
      name: 'การจัดเก็บเอกสารทางบัญชี',
      description: 'เปอร์เซ็นต์เอกสารที่จัดเก็บครบถ้วนและถูกต้องตามมาตรฐาน',
      weight: 1.0,
      targetValue: 95,
      scoringCriteria: ScoringEngine.createPercentageScoringCriteria()
    });

    // 5. KPI สำหรับการตอบสนองงานภายใน
    const responseKPI = await kpiService.create({
      name: 'การตอบสนองคำขอข้อมูลภายใน',
      description: 'เปอร์เซ็นต์การตอบสนองคำขอข้อมูลจากแผนกอื่นภายใน 2 วันทำการ',
      weight: 1.0,
      targetValue: 90,
      scoringCriteria: {
        ranges: [
          { min: 0, max: 70, score: 1 },
          { min: 70.01, max: 80, score: 2 },
          { min: 80.01, max: 88, score: 3 },
          { min: 88.01, max: 95, score: 4 },
          { min: 95.01, max: 100, score: 5 }
        ]
      }
    });

    console.log('\n✅ สร้าง KPI สำหรับแผนกบัญชี 5 ตัว:');
    console.log(`  1. ${accuracyKPI.name} (น้ำหนัก: ${accuracyKPI.weight})`);
    console.log(`  2. ${timelinessKPI.name} (น้ำหนัก: ${timelinessKPI.weight})`);
    console.log(`  3. ${costControlKPI.name} (น้ำหนัก: ${costControlKPI.weight})`);
    console.log(`  4. ${documentKPI.name} (น้ำหนัก: ${documentKPI.weight})`);
    console.log(`  5. ${responseKPI.name} (น้ำหนัก: ${responseKPI.weight})`);

    console.log('\n✅ สร้างข้อมูล Demo แผนกบัญชีเสร็จสิ้น!');
    console.log('\n📋 ข้อมูลที่สร้าง:');
    console.log(`   - แผนก: ${accounting.name}`);
    console.log(`   - พนักงาน: ${accountingManager.name}, ${seniorAccountant.name}, ${juniorAccountant.name}`);
    console.log(`   - KPI: 5 ตัววัด ครอบคลุมงานหลักของแผนกบัญชี`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล Demo:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

createAccountingDemo();