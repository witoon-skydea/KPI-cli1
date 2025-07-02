import { StaffService } from '../core/services/StaffService.js';
import { KPIService } from '../core/services/KPIService.js';
import { StaffKPIService } from '../core/services/StaffKPIService.js';
import { DataEntryService } from '../core/services/DataEntryService.js';
import { EvaluationService } from '../core/services/EvaluationService.js';
import { closeDatabase } from './connection.js';

async function createQ1DemoData(): Promise<void> {
  console.log('สร้างข้อมูล Demo ไตรมาสแรก (Q1/2025) สำหรับแผนกบัญชี...\n');
  
  try {
    const staffService = new StaffService();
    const kpiService = new KPIService();
    const staffKPIService = new StaffKPIService();
    const dataEntryService = new DataEntryService();
    const evaluationService = new EvaluationService();

    // ดึงข้อมูลพนักงานและ KPI ที่มีอยู่
    const allStaff = await staffService.findAll();
    const allKPIs = await kpiService.findAll();

    console.log('📋 ข้อมูลพนักงาน:');
    allStaff.forEach(staff => {
      console.log(`  - ${staff.name} (${staff.employeeId})`);
    });

    console.log('\\n📊 ข้อมูล KPI:');
    allKPIs.forEach(kpi => {
      console.log(`  - ${kpi.name} (น้ำหนัก: ${kpi.weight})`);
    });

    // มอบหมาย KPI ให้กับพนักงาน
    console.log('\\n🎯 การมอบหมาย KPI:');

    // ผู้จัดการแผนกบัญชี - รับผิดชอบ KPI หลักทั้งหมด
    const manager = allStaff.find(s => s.employeeId === 'ACC001');
    const seniorAccountant = allStaff.find(s => s.employeeId === 'ACC002');
    const juniorAccountant = allStaff.find(s => s.employeeId === 'ACC003');

    if (!manager || !seniorAccountant || !juniorAccountant) {
      throw new Error('ไม่พบข้อมูลพนักงานที่ต้องการ');
    }

    // มอบหมาย KPI ให้ผู้จัดการ (ทุก KPI)
    for (const kpi of allKPIs) {
      await staffKPIService.assignKPI({
        staffId: manager.id,
        kpiId: kpi.id,
        assignedDate: '2025-01-01'
      });
      console.log(`  ✅ มอบหมาย "${kpi.name}" ให้ ${manager.name}`);
    }

    // มอบหมาย KPI ให้นักบัญชีอาวุโส (KPI ที่เกี่ยวข้องกับการปฏิบัติงาน)
    const seniorKPIs = allKPIs.filter(kpi => 
      kpi.name.includes('ความแม่นยำ') || 
      kpi.name.includes('การปิดบัญชี') || 
      kpi.name.includes('การจัดเก็บเอกสาร')
    );
    for (const kpi of seniorKPIs) {
      await staffKPIService.assignKPI({
        staffId: seniorAccountant.id,
        kpiId: kpi.id,
        assignedDate: '2025-01-01'
      });
      console.log(`  ✅ มอบหมาย "${kpi.name}" ให้ ${seniorAccountant.name}`);
    }

    // มอบหมาย KPI ให้นักบัญชีเจนิเออร์ (KPI ที่เหมาะสม)
    const juniorKPIs = allKPIs.filter(kpi => 
      kpi.name.includes('การจัดเก็บเอกสาร') || 
      kpi.name.includes('การตอบสนอง')
    );
    for (const kpi of juniorKPIs) {
      await staffKPIService.assignKPI({
        staffId: juniorAccountant.id,
        kpiId: kpi.id,
        assignedDate: '2025-01-01'
      });
      console.log(`  ✅ มอบหมาย "${kpi.name}" ให้ ${juniorAccountant.name}`);
    }

    // สร้างข้อมูล Q1/2025
    console.log('\\n📊 บันทึกผลการดำเนินงาน Q1/2025:');

    // ข้อมูลสำหรับผู้จัดการ
    console.log('\\n👤 ผลงาน: ' + manager.name);

    // 1. ความแม่นยำของรายงานการเงิน
    const accuracyKPI = allKPIs.find(k => k.name.includes('ความแม่นยำ'));
    if (accuracyKPI) {
      await dataEntryService.createEntry({
        staffId: manager.id,
        kpiId: accuracyKPI.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues: { accuracy_percentage: 97.5 }
      });
      
      const evaluation1 = await evaluationService.calculateKPIEvaluation({
        staffId: manager.id,
        kpiId: accuracyKPI.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${accuracyKPI.name}: 97.5% (${evaluation1.score}/5 คะแนน)`);
    }

    // 2. การปิดบัญชีตามกำหนดเวลา
    const timelinessKPI = allKPIs.find(k => k.name.includes('การปิดบัญชี'));
    if (timelinessKPI) {
      await dataEntryService.createEntry({
        staffId: manager.id,
        kpiId: timelinessKPI.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues: { days_to_close: 4 }
      });
      
      const evaluation2 = await evaluationService.calculateKPIEvaluation({
        staffId: manager.id,
        kpiId: timelinessKPI.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${timelinessKPI.name}: 4 วัน (${evaluation2.score}/5 คะแนน)`);
    }

    // 3. การควบคุมค่าใช้จ่ายแผนก
    const costControlKPI = allKPIs.find(k => k.name.includes('การควบคุมค่าใช้จ่าย'));
    if (costControlKPI) {
      await dataEntryService.createEntry({
        staffId: manager.id,
        kpiId: costControlKPI.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues: { 
          budget: 150000,
          actual_cost: 142000 
        }
      });
      
      const evaluation3 = await evaluationService.calculateKPIEvaluation({
        staffId: manager.id,
        kpiId: costControlKPI.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${costControlKPI.name}: ประหยัด 5.33% (${evaluation3.score}/5 คะแนน)`);
    }

    // 4. การจัดเก็บเอกสารทางบัญชี
    const documentKPI = allKPIs.find(k => k.name.includes('การจัดเก็บเอกสาร'));
    if (documentKPI) {
      await dataEntryService.createEntry({
        staffId: manager.id,
        kpiId: documentKPI.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues: { document_accuracy: 96 }
      });
      
      const evaluation4 = await evaluationService.calculateKPIEvaluation({
        staffId: manager.id,
        kpiId: documentKPI.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${documentKPI.name}: 96% (${evaluation4.score}/5 คะแนน)`);
    }

    // 5. การตอบสนองคำขอข้อมูลภายใน
    const responseKPI = allKPIs.find(k => k.name.includes('การตอบสนอง'));
    if (responseKPI) {
      await dataEntryService.createEntry({
        staffId: manager.id,
        kpiId: responseKPI.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues: { response_rate: 94 }
      });
      
      const evaluation5 = await evaluationService.calculateKPIEvaluation({
        staffId: manager.id,
        kpiId: responseKPI.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${responseKPI.name}: 94% (${evaluation5.score}/5 คะแนน)`);
    }

    // คำนวณสรุปผลสำหรับผู้จัดการ
    const managerSummary = await evaluationService.calculateStaffSummary(
      manager.id, 2025, 1
    );
    console.log(`  🏆 สรุปผลรวม: ${managerSummary.percentageScore}% (เกรด ${managerSummary.grade})`);

    // ข้อมูลสำหรับนักบัญชีอาวุโส
    console.log('\\n👤 ผลงาน: ' + seniorAccountant.name);

    for (const kpi of seniorKPIs) {
      let dataValues: Record<string, unknown> = {};
      let resultText = '';

      if (kpi.name.includes('ความแม่นยำ')) {
        dataValues = { accuracy_percentage: 95.8 };
        resultText = '95.8%';
      } else if (kpi.name.includes('การปิดบัญชี')) {
        dataValues = { days_to_close: 5 };
        resultText = '5 วัน';
      } else if (kpi.name.includes('การจัดเก็บเอกสาร')) {
        dataValues = { document_accuracy: 98 };
        resultText = '98%';
      }

      await dataEntryService.createEntry({
        staffId: seniorAccountant.id,
        kpiId: kpi.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues
      });

      const evaluation = await evaluationService.calculateKPIEvaluation({
        staffId: seniorAccountant.id,
        kpiId: kpi.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${kpi.name}: ${resultText} (${evaluation.score}/5 คะแนน)`);
    }

    const seniorSummary = await evaluationService.calculateStaffSummary(
      seniorAccountant.id, 2025, 1
    );
    console.log(`  🏆 สรุปผลรวม: ${seniorSummary.percentageScore}% (เกรด ${seniorSummary.grade})`);

    // ข้อมูลสำหรับนักบัญชีเจนิเออร์
    console.log('\\n👤 ผลงาน: ' + juniorAccountant.name);

    for (const kpi of juniorKPIs) {
      let dataValues: Record<string, unknown> = {};
      let resultText = '';

      if (kpi.name.includes('การจัดเก็บเอกสาร')) {
        dataValues = { document_accuracy: 92 };
        resultText = '92%';
      } else if (kpi.name.includes('การตอบสนอง')) {
        dataValues = { response_rate: 87 };
        resultText = '87%';
      }

      await dataEntryService.createEntry({
        staffId: juniorAccountant.id,
        kpiId: kpi.id,
        periodYear: 2025,
        periodQuarter: 1,
        dataValues
      });

      const evaluation = await evaluationService.calculateKPIEvaluation({
        staffId: juniorAccountant.id,
        kpiId: kpi.id,
        periodYear: 2025,
        periodQuarter: 1
      });
      console.log(`  📈 ${kpi.name}: ${resultText} (${evaluation.score}/5 คะแนน)`);
    }

    const juniorSummary = await evaluationService.calculateStaffSummary(
      juniorAccountant.id, 2025, 1
    );
    console.log(`  🏆 สรุปผลรวม: ${juniorSummary.percentageScore}% (เกรด ${juniorSummary.grade})`);

    console.log('\\n✅ สร้างข้อมูล Demo Q1/2025 เสร็จสิ้น!');
    console.log('\\n📊 สรุปผลการประเมิน Q1/2025:');
    console.log(`  🥇 ${manager.name}: ${managerSummary.percentageScore}% (เกรด ${managerSummary.grade})`);
    console.log(`  🥈 ${seniorAccountant.name}: ${seniorSummary.percentageScore}% (เกรด ${seniorSummary.grade})`);
    console.log(`  🥉 ${juniorAccountant.name}: ${juniorSummary.percentageScore}% (เกรด ${juniorSummary.grade})`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการสร้างข้อมูล Q1:', error);
    process.exit(1);
  } finally {
    closeDatabase();
  }
}

createQ1DemoData();