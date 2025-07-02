import inquirer from 'inquirer';
import chalk from 'chalk';
import { DepartmentService } from '../core/services/DepartmentService.js';
import { StaffService } from '../core/services/StaffService.js';
import { KPIService } from '../core/services/KPIService.js';
import { StaffKPIService } from '../core/services/StaffKPIService.js';
import { DataEntryService } from '../core/services/DataEntryService.js';
import { EvaluationService } from '../core/services/EvaluationService.js';
import { ReportService } from '../core/services/ReportService.js';
import { closeDatabase } from '../database/connection.js';
import type { Department, Staff, KPI } from '../types/index.js';

export class InteractiveCLI {
  private departmentService = new DepartmentService();
  private staffService = new StaffService();
  private kpiService = new KPIService();
  private staffKPIService = new StaffKPIService();
  private dataEntryService = new DataEntryService();
  private evaluationService = new EvaluationService();
  private reportService = new ReportService();

  async start(): Promise<void> {
    console.log(chalk.bold.cyan('\n🎯 ระบบบริหารจัดการ KPI'));
    console.log(chalk.cyan('═'.repeat(50)));

    while (true) {
      try {
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'เลือกเมนูที่ต้องการ:',
            choices: [
              { name: '📊 ดูรายงานผลการดำเนินงาน', value: 'reports' },
              { name: '👥 จัดการพนักงาน', value: 'staff' },
              { name: '🎯 จัดการ KPI', value: 'kpi' },
              { name: '📝 บันทึกข้อมูลผลงาน', value: 'data-entry' },
              { name: '🔄 มอบหมาย KPI', value: 'assign-kpi' },
              { name: '🏢 จัดการแผนก', value: 'departments' },
              { name: '🚪 ออกจากระบบ', value: 'exit' }
            ]
          }
        ]);

        switch (action) {
          case 'reports':
            await this.handleReports();
            break;
          case 'staff':
            await this.handleStaff();
            break;
          case 'kpi':
            await this.handleKPI();
            break;
          case 'data-entry':
            await this.handleDataEntry();
            break;
          case 'assign-kpi':
            await this.handleAssignKPI();
            break;
          case 'departments':
            await this.handleDepartments();
            break;
          case 'exit':
            console.log(chalk.green('\n👋 ขอบคุณที่ใช้บริการ!'));
            return;
        }

        // เพิ่มช่องว่างระหว่างการทำงาน
        console.log('\n' + '─'.repeat(50));
        
        const { continue: continueWork } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continue',
            message: 'ต้องการดำเนินการต่อหรือไม่?',
            default: true
          }
        ]);

        if (!continueWork) {
          console.log(chalk.green('\n👋 ขอบคุณที่ใช้บริการ!'));
          break;
        }

      } catch (error: any) {
        console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
        
        const { retry } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'retry',
            message: 'ต้องการลองใหม่หรือไม่?',
            default: true
          }
        ]);

        if (!retry) break;
      }
    }

    closeDatabase();
  }

  private async handleReports(): Promise<void> {
    console.log(chalk.bold.yellow('\n📊 รายงานผลการดำเนินงาน'));
    console.log('─'.repeat(30));

    const { reportType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'reportType',
        message: 'เลือกประเภทรายงาน:',
        choices: [
          { name: '📈 รายงานไตรมาส', value: 'quarterly' },
          { name: '📅 รายงานประจำปี (ยังไม่พร้อม)', value: 'annual' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (reportType === 'back') return;

    if (reportType === 'quarterly') {
      await this.generateQuarterlyReport();
    } else {
      console.log(chalk.yellow('🚧 ฟีเจอร์นี้ยังไม่พร้อมใช้งาน'));
    }
  }

  private async generateQuarterlyReport(): Promise<void> {
    // เลือกแผนก
    const departments = await this.departmentService.findAll();
    if (departments.length === 0) {
      console.log(chalk.red('❌ ไม่พบแผนกในระบบ'));
      return;
    }

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'เลือกแผนก:',
        choices: departments.map(dept => ({
          name: `${dept.name} (${dept.description || 'ไม่มีคำอธิบาย'})`,
          value: dept.id
        }))
      }
    ]);

    // เลือกปี
    const currentYear = new Date().getFullYear();
    const { year } = await inquirer.prompt([
      {
        type: 'list',
        name: 'year',
        message: 'เลือกปี:',
        choices: [
          { name: `${currentYear} (ปีปัจจุบัน)`, value: currentYear },
          { name: `${currentYear - 1}`, value: currentYear - 1 },
          { name: `${currentYear + 1}`, value: currentYear + 1 }
        ]
      }
    ]);

    // เลือกไตรมาส
    const { quarter } = await inquirer.prompt([
      {
        type: 'list',
        name: 'quarter',
        message: 'เลือกไตรมาส:',
        choices: [
          { name: 'ไตรมาสที่ 1 (มกราคม-มีนาคม)', value: 1 },
          { name: 'ไตรมาสที่ 2 (เมษายน-มิถุนายน)', value: 2 },
          { name: 'ไตรมาสที่ 3 (กรกฎาคม-กันยายน)', value: 3 },
          { name: 'ไตรมาสที่ 4 (ตุลาคม-ธันวาคม)', value: 4 }
        ]
      }
    ]);

    console.log(chalk.blue('\n🔄 กำลังสร้างรายงาน...\n'));

    try {
      const report = await this.reportService.generateQuarterlyReport(
        departmentId,
        year,
        quarter
      );

      this.displayQuarterlyReport(report);
    } catch (error: any) {
      console.error(chalk.red(`❌ ไม่สามารถสร้างรายงานได้: ${error.message}`));
    }
  }

  private displayQuarterlyReport(report: any): void {
    const { period, department, staffReports, departmentSummary } = report;

    // Header
    console.log(chalk.bold.cyan('═'.repeat(80)));
    console.log(chalk.bold.cyan(`📊 รายงานผลการดำเนินงาน ${period.displayName}`));
    console.log(chalk.bold.cyan(`🏢 แผนก: ${department.name}`));
    console.log(chalk.bold.cyan('═'.repeat(80)));

    // Department Summary
    console.log(chalk.bold.yellow('\n📈 สรุปผลรวมของแผนก'));
    console.log('─'.repeat(50));
    console.log(`👥 จำนวนพนักงาน: ${departmentSummary.totalStaff} คน`);
    console.log(`📊 คะแนนเฉลี่ย: ${this.reportService.formatPercentage(departmentSummary.averageScore)}`);
    
    console.log('\n🏆 การกระจายของเกรด:');
    Object.entries(departmentSummary.gradeDistribution).forEach(([grade, count]) => {
      const color = this.reportService.getGradeColor(grade);
      console.log(`  ${chalk[color](`เกรด ${grade}`)}: ${count} คน`);
    });

    if (departmentSummary.topPerformers.length > 0) {
      console.log('\n🌟 ผู้มีผลงานดีเด่น:');
      departmentSummary.topPerformers.forEach((staff: any, index: number) => {
        console.log(`  ${index + 1}. ${staff.name} (${staff.position})`);
      });
    }

    // Individual Staff Reports
    console.log(chalk.bold.green('\n👤 รายงานรายบุคคล'));
    console.log('═'.repeat(80));

    staffReports.forEach((staffReport: any, index: number) => {
      const { staff, evaluations, summary } = staffReport;
      
      console.log(`\n${index + 1}. ${chalk.bold(staff.name)} (${staff.position})`);
      console.log(`   🏆 คะแนนรวม: ${this.reportService.formatPercentage(summary.percentageScore || 0)} (เกรด ${chalk[this.reportService.getGradeColor(summary.grade || 'F')](summary.grade || 'F')})`);
      
      console.log('   📊 รายละเอียด KPI:');
      evaluations.forEach((evaluation: any) => {
        const achievementPercent = evaluation.targetValue > 0 
          ? ((evaluation.calculatedValue / evaluation.targetValue) * 100).toFixed(1)
          : 'N/A';
        
        console.log(`      • ${evaluation.kpi.name}`);
        console.log(`        คะแนน: ${this.reportService.formatScore(evaluation.score)} | ผลจริง: ${evaluation.calculatedValue} | เป้าหมาย: ${evaluation.targetValue || 'N/A'}`);
        if (achievementPercent !== 'N/A') {
          console.log(`        ความสำเร็จ: ${achievementPercent}%`);
        }
      });
      
      if (index < staffReports.length - 1) {
        console.log('   ' + '─'.repeat(50));
      }
    });

    console.log(chalk.bold.cyan('\n═'.repeat(80)));
  }

  private async handleStaff(): Promise<void> {
    console.log(chalk.bold.yellow('\n👥 จัดการพนักงาน'));
    console.log('─'.repeat(20));

    const { staffAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'staffAction',
        message: 'เลือกการดำเนินการ:',
        choices: [
          { name: '📋 ดูรายชื่อพนักงาน', value: 'list' },
          { name: '➕ เพิ่มพนักงานใหม่', value: 'add' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (staffAction === 'back') return;

    switch (staffAction) {
      case 'list':
        await this.listStaff();
        break;
      case 'add':
        await this.addStaff();
        break;
    }
  }

  private async listStaff(): Promise<void> {
    const staff = await this.staffService.findAll();
    
    if (staff.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มีพนักงานในระบบ'));
      return;
    }

    console.log(chalk.bold.green('\n📋 รายชื่อพนักงาน'));
    console.log('─'.repeat(50));

    staff.forEach((employee, index) => {
      console.log(`${index + 1}. ${chalk.bold(employee.name)} (${employee.employeeId})`);
      console.log(`   📧 ${employee.email}`);
      console.log(`   🏢 ตำแหน่ง: ${employee.position}`);
      console.log(`   📅 วันที่เข้าทำงาน: ${employee.hireDate}`);
      if (index < staff.length - 1) {
        console.log('');
      }
    });
  }

  private async addStaff(): Promise<void> {
    console.log(chalk.bold.blue('\n➕ เพิ่มพนักงานใหม่'));
    console.log('─'.repeat(20));

    // ดึงรายชื่อแผนก
    const departments = await this.departmentService.findAll();
    if (departments.length === 0) {
      console.log(chalk.red('❌ ไม่พบแผนกในระบบ กรุณาสร้างแผนกก่อน'));
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'employeeId',
        message: 'รหัสพนักงาน:',
        validate: (input: string) => input.length > 0 || 'กรุณาใส่รหัสพนักงาน'
      },
      {
        type: 'input',
        name: 'name',
        message: 'ชื่อ-นามสกุล:',
        validate: (input: string) => input.length > 0 || 'กรุณาใส่ชื่อ-นามสกุล'
      },
      {
        type: 'input',
        name: 'email',
        message: 'อีเมล:',
        validate: (input: string) => {
          if (input.length === 0) return 'กรุณาใส่อีเมล';
          if (!input.includes('@')) return 'รูปแบบอีเมลไม่ถูกต้อง';
          return true;
        }
      },
      {
        type: 'list',
        name: 'departmentId',
        message: 'เลือกแผนก:',
        choices: departments.map(dept => ({
          name: dept.name,
          value: dept.id
        }))
      },
      {
        type: 'input',
        name: 'position',
        message: 'ตำแหน่ง:',
        validate: (input: string) => input.length > 0 || 'กรุณาใส่ตำแหน่ง'
      },
      {
        type: 'input',
        name: 'hireDate',
        message: 'วันที่เข้าทำงาน (YYYY-MM-DD):',
        default: new Date().toISOString().split('T')[0],
        validate: (input: string) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
            return 'รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)';
          }
          return true;
        }
      }
    ]);

    try {
      const newStaff = await this.staffService.create(answers);
      console.log(chalk.green(`✅ เพิ่มพนักงาน ${newStaff.name} เรียบร้อยแล้ว`));
    } catch (error: any) {
      console.error(chalk.red(`❌ ไม่สามารถเพิ่มพนักงานได้: ${error.message}`));
    }
  }

  private async handleKPI(): Promise<void> {
    console.log(chalk.bold.yellow('\n🎯 จัดการ KPI'));
    console.log('─'.repeat(15));

    const { kpiAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'kpiAction',
        message: 'เลือกการดำเนินการ:',
        choices: [
          { name: '📋 ดูรายการ KPI', value: 'list' },
          { name: '➕ เพิ่ม KPI ใหม่', value: 'add' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (kpiAction === 'back') return;

    switch (kpiAction) {
      case 'list':
        await this.listKPIs();
        break;
      case 'add':
        await this.addKPI();
        break;
    }
  }

  private async listKPIs(): Promise<void> {
    const kpis = await this.kpiService.findAll();
    
    if (kpis.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มี KPI ในระบบ'));
      return;
    }

    console.log(chalk.bold.green('\n📋 รายการ KPI'));
    console.log('─'.repeat(50));

    kpis.forEach((kpi, index) => {
      console.log(`${index + 1}. ${chalk.bold(kpi.name)}`);
      console.log(`   📝 ${kpi.description}`);
      console.log(`   ⚖️ น้ำหนัก: ${kpi.weight}`);
      console.log(`   🎯 เป้าหมาย: ${kpi.targetValue || 'ไม่ระบุ'}`);
      if (index < kpis.length - 1) {
        console.log('');
      }
    });
  }

  private async addKPI(): Promise<void> {
    console.log(chalk.bold.blue('\n➕ เพิ่ม KPI ใหม่'));
    console.log('─'.repeat(20));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'ชื่อ KPI:',
        validate: (input: string) => input.length > 0 || 'กรุณาใส่ชื่อ KPI'
      },
      {
        type: 'input',
        name: 'description',
        message: 'คำอธิบาย:',
        validate: (input: string) => input.length > 0 || 'กรุณาใส่คำอธิบาย'
      },
      {
        type: 'number',
        name: 'weight',
        message: 'น้ำหนัก (1.0-5.0):',
        default: 1.0,
        validate: (input: number) => {
          if (isNaN(input) || input < 0.1 || input > 5.0) {
            return 'น้ำหนักต้องอยู่ระหว่าง 0.1-5.0';
          }
          return true;
        }
      },
      {
        type: 'number',
        name: 'targetValue',
        message: 'เป้าหมาย (เลขจำนวนเต็ม, หรือ 0 ถ้าไม่มี):',
        default: 0
      }
    ]);

    try {
      const newKPI = await this.kpiService.create({
        name: answers.name,
        description: answers.description,
        weight: answers.weight,
        targetValue: answers.targetValue > 0 ? answers.targetValue : null
      });
      console.log(chalk.green(`✅ เพิ่ม KPI "${newKPI.name}" เรียบร้อยแล้ว`));
    } catch (error: any) {
      console.error(chalk.red(`❌ ไม่สามารถเพิ่ม KPI ได้: ${error.message}`));
    }
  }

  private async handleDataEntry(): Promise<void> {
    console.log(chalk.bold.yellow('\n📝 บันทึกข้อมูลผลงาน'));
    console.log('─'.repeat(25));

    // เลือกพนักงาน
    const staff = await this.staffService.findAll();
    if (staff.length === 0) {
      console.log(chalk.red('❌ ไม่พบพนักงานในระบบ'));
      return;
    }

    const { staffId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'staffId',
        message: 'เลือกพนักงาน:',
        choices: staff.map(s => ({
          name: `${s.name} (${s.employeeId})`,
          value: s.id
        }))
      }
    ]);

    // ดึง KPI ที่ถูกมอบหมายให้พนักงาน
    const assignments = await this.staffKPIService.getStaffKPIs(staffId);
    const activeAssignments = assignments.filter(a => a.active);

    if (activeAssignments.length === 0) {
      console.log(chalk.red('❌ พนักงานคนนี้ยังไม่ได้รับการมอบหมาย KPI'));
      return;
    }

    const { kpiId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'kpiId',
        message: 'เลือก KPI:',
        choices: activeAssignments.map(a => ({
          name: `${a.kpiName} (น้ำหนัก: ${a.kpiWeight})`,
          value: a.kpiId
        }))
      }
    ]);

    // เลือกช่วงเวลา
    const currentYear = new Date().getFullYear();
    const { year, quarter } = await inquirer.prompt([
      {
        type: 'list',
        name: 'year',
        message: 'เลือกปี:',
        choices: [
          { name: `${currentYear}`, value: currentYear },
          { name: `${currentYear - 1}`, value: currentYear - 1 },
          { name: `${currentYear + 1}`, value: currentYear + 1 }
        ]
      },
      {
        type: 'list',
        name: 'quarter',
        message: 'เลือกไตรมาส:',
        choices: [
          { name: 'ไตรมาสที่ 1', value: 1 },
          { name: 'ไตรมาสที่ 2', value: 2 },
          { name: 'ไตรมาสที่ 3', value: 3 },
          { name: 'ไตรมาสที่ 4', value: 4 }
        ]
      }
    ]);

    // ดึงข้อมูล KPI
    const kpi = await this.kpiService.findById(kpiId);
    if (!kpi) {
      console.log(chalk.red('❌ ไม่พบข้อมูล KPI'));
      return;
    }

    console.log(chalk.blue(`\n📊 กรอกข้อมูลสำหรับ: ${kpi.name}`));
    console.log(`📝 ${kpi.description}`);

    // ถ้า KPI มี raw data schema ให้กรอกตาม schema
    if (kpi.rawDataSchemaJson && kpi.rawDataSchemaJson.fields) {
      const dataValues: Record<string, number> = {};
      
      for (const field of kpi.rawDataSchemaJson.fields) {
        const { value } = await inquirer.prompt([
          {
            type: 'number',
            name: 'value',
            message: `${field.description || field.name}:`,
            validate: (input: number) => {
              if (field.required && (isNaN(input) || input === null)) {
                return 'ช่องนี้จำเป็นต้องกรอก';
              }
              return true;
            }
          }
        ]);
        dataValues[field.name] = value;
      }

      try {
        await this.dataEntryService.createEntry({
          staffId,
          kpiId,
          periodYear: year,
          periodQuarter: quarter,
          dataValues
        });

        // คำนวณผลประเมิน
        const evaluation = await this.evaluationService.calculateKPIEvaluation({
          staffId,
          kpiId,
          periodYear: year,
          periodQuarter: quarter
        });

        console.log(chalk.green(`✅ บันทึกข้อมูลเรียบร้อยแล้ว`));
        console.log(chalk.blue(`📊 ผลการประเมิน: ${evaluation.calculatedValue} (${evaluation.score}/5 คะแนน)`));
      } catch (error: any) {
        console.error(chalk.red(`❌ ไม่สามารถบันทึกข้อมูลได้: ${error.message}`));
      }
    } else {
      // KPI ไม่มี schema ให้กรอกค่าโดยตรง
      const { value } = await inquirer.prompt([
        {
          type: 'number',
          name: 'value',
          message: `ค่าผลงาน:`,
          validate: (input: number) => !isNaN(input) || 'กรุณาใส่ตัวเลข'
        }
      ]);

      try {
        await this.dataEntryService.createEntry({
          staffId,
          kpiId,
          periodYear: year,
          periodQuarter: quarter,
          dataValues: { value }
        });

        // คำนวณผลประเมิน
        const evaluation = await this.evaluationService.calculateKPIEvaluation({
          staffId,
          kpiId,
          periodYear: year,
          periodQuarter: quarter
        });

        console.log(chalk.green(`✅ บันทึกข้อมูลเรียบร้อยแล้ว`));
        console.log(chalk.blue(`📊 ผลการประเมิน: ${evaluation.calculatedValue} (${evaluation.score}/5 คะแนน)`));
      } catch (error: any) {
        console.error(chalk.red(`❌ ไม่สามารถบันทึกข้อมูลได้: ${error.message}`));
      }
    }
  }

  private async handleAssignKPI(): Promise<void> {
    console.log(chalk.bold.yellow('\n🔄 มอบหมาย KPI'));
    console.log('─'.repeat(20));

    const { assignAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'assignAction',
        message: 'เลือกการดำเนินการ:',
        choices: [
          { name: '➕ มอบหมาย KPI ใหม่', value: 'assign' },
          { name: '📋 ดูการมอบหมายปัจจุบัน', value: 'list' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (assignAction === 'back') return;

    switch (assignAction) {
      case 'assign':
        await this.assignKPI();
        break;
      case 'list':
        await this.listAssignments();
        break;
    }
  }

  private async assignKPI(): Promise<void> {
    console.log(chalk.bold.blue('\n➕ มอบหมาย KPI ใหม่'));
    console.log('─'.repeat(20));

    // เลือกพนักงาน
    const staff = await this.staffService.findAll();
    if (staff.length === 0) {
      console.log(chalk.red('❌ ไม่พบพนักงานในระบบ'));
      return;
    }

    const { staffId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'staffId',
        message: 'เลือกพนักงาน:',
        choices: staff.map(s => ({
          name: `${s.name} (${s.employeeId})`,
          value: s.id
        }))
      }
    ]);

    // เลือก KPI
    const kpis = await this.kpiService.findAll();
    if (kpis.length === 0) {
      console.log(chalk.red('❌ ไม่พบ KPI ในระบบ'));
      return;
    }

    const { kpiId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'kpiId',
        message: 'เลือก KPI:',
        choices: kpis.map(k => ({
          name: `${k.name} (น้ำหนัก: ${k.weight})`,
          value: k.id
        }))
      }
    ]);

    try {
      await this.staffKPIService.assignKPI({
        staffId,
        kpiId,
        assignedDate: new Date().toISOString()
      });

      const selectedStaff = staff.find(s => s.id === staffId);
      const selectedKPI = kpis.find(k => k.id === kpiId);
      
      console.log(chalk.green(`✅ มอบหมาย "${selectedKPI?.name}" ให้ ${selectedStaff?.name} เรียบร้อยแล้ว`));
    } catch (error: any) {
      console.error(chalk.red(`❌ ไม่สามารถมอบหมาย KPI ได้: ${error.message}`));
    }
  }

  private async listAssignments(): Promise<void> {
    const assignments = await this.staffKPIService.getActiveAssignments();
    
    if (assignments.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มีการมอบหมาย KPI'));
      return;
    }

    console.log(chalk.bold.green('\n📋 การมอบหมาย KPI ปัจจุบัน'));
    console.log('─'.repeat(50));

    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${chalk.bold(assignment.staffName)} → ${assignment.kpiName}`);
      console.log(`   📅 วันที่มอบหมาย: ${assignment.assignedDate}`);
      console.log(`   ⚖️ น้ำหนัก: ${assignment.kpiWeight}`);
      if (index < assignments.length - 1) {
        console.log('');
      }
    });
  }

  private async handleDepartments(): Promise<void> {
    console.log(chalk.bold.yellow('\n🏢 จัดการแผนก'));
    console.log('─'.repeat(15));

    const { deptAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'deptAction',
        message: 'เลือกการดำเนินการ:',
        choices: [
          { name: '📋 ดูรายชื่อแผนก', value: 'list' },
          { name: '➕ เพิ่มแผนกใหม่', value: 'add' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (deptAction === 'back') return;

    switch (deptAction) {
      case 'list':
        await this.listDepartments();
        break;
      case 'add':
        await this.addDepartment();
        break;
    }
  }

  private async listDepartments(): Promise<void> {
    const departments = await this.departmentService.findAll();
    
    if (departments.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มีแผนกในระบบ'));
      return;
    }

    console.log(chalk.bold.green('\n📋 รายชื่อแผนก'));
    console.log('─'.repeat(50));

    for (const dept of departments) {
      const staffCount = await this.staffService.findByDepartment(dept.id);
      console.log(`${chalk.bold(dept.name)}`);
      console.log(`   📝 ${dept.description || 'ไม่มีคำอธิบาย'}`);
      console.log(`   👥 จำนวนพนักงาน: ${staffCount.length} คน`);
      console.log('');
    }
  }

  private async addDepartment(): Promise<void> {
    console.log(chalk.bold.blue('\n➕ เพิ่มแผนกใหม่'));
    console.log('─'.repeat(20));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'ชื่อแผนก:',
        validate: (input: string) => input.length > 0 || 'กรุณาใส่ชื่อแผนก'
      },
      {
        type: 'input',
        name: 'description',
        message: 'คำอธิบาย (ไม่บังคับ):'
      }
    ]);

    try {
      const newDept = await this.departmentService.create({
        name: answers.name,
        description: answers.description || null
      });
      console.log(chalk.green(`✅ เพิ่มแผนก "${newDept.name}" เรียบร้อยแล้ว`));
    } catch (error: any) {
      console.error(chalk.red(`❌ ไม่สามารถเพิ่มแผนกได้: ${error.message}`));
    }
  }
}