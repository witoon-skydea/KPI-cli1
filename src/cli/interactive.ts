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
              { name: '📊 วิเคราะห์ข้อมูลและประสิทธิภาพ', value: 'analytics' },
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
          case 'analytics':
            await this.handleAdvancedAnalytics();
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
          { name: '👁️  ดูข้อมูลรายละเอียดพนักงาน', value: 'detail' },
          { name: '➕ เพิ่มพนักงานใหม่', value: 'add' },
          { name: '✏️  แก้ไขข้อมูลพนักงาน', value: 'edit' },
          { name: '📊 ดูผลการประเมินรายบุคคล', value: 'performance' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (staffAction === 'back') return;

    switch (staffAction) {
      case 'list':
        await this.listStaff();
        break;
      case 'detail':
        await this.viewStaffDetail();
        break;
      case 'add':
        await this.addStaff();
        break;
      case 'edit':
        await this.editStaff();
        break;
      case 'performance':
        await this.viewStaffPerformance();
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

    // แยกตามแผนก
    const departments = await this.departmentService.findAll();
    const deptMap = new Map(departments.map(d => [d.id, d.name]));

    staff.forEach((employee, index) => {
      const statusIcon = employee.active ? '✅' : '❌';
      const deptName = deptMap.get(employee.departmentId || 0) || 'ไม่ระบุ';
      
      console.log(`${index + 1}. ${statusIcon} ${chalk.bold(employee.name)} (${employee.employeeId})`);
      console.log(`   📧 ${employee.email}`);
      console.log(`   🏢 ตำแหน่ง: ${employee.position || 'N/A'}`);
      console.log(`   🏢 แผนก: ${deptName}`);
      console.log(`   📅 วันที่เข้าทำงาน: ${employee.hireDate}`);
      console.log(`   🟢 สถานะ: ${employee.active ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}`);
      if (index < staff.length - 1) {
        console.log('');
      }
    });
  }

  private async viewStaffDetail(): Promise<void> {
    const staff = await this.staffService.findAll();
    
    if (staff.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มีพนักงานในระบบ'));
      return;
    }

    const { selectedStaff } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedStaff',
        message: 'เลือกพนักงานที่ต้องการดูรายละเอียด:',
        choices: staff.map(s => ({
          name: `${s.name} (${s.employeeId}) - ${s.position}`,
          value: s.id
        }))
      }
    ]);

    const selectedEmployee = staff.find(s => s.id === selectedStaff)!;
    const department = await this.departmentService.findById(selectedEmployee.departmentId || 0);
    
    console.log(chalk.bold.blue('\n👤 ข้อมูลรายละเอียดพนักงาน'));
    console.log('═'.repeat(60));
    console.log(`📛 ชื่อ: ${chalk.bold(selectedEmployee.name)}`);
    console.log(`🏷️  รหัสพนักงาน: ${selectedEmployee.employeeId}`);
    console.log(`📧 อีเมล: ${selectedEmployee.email}`);
    console.log(`🏢 ตำแหน่ง: ${selectedEmployee.position || 'N/A'}`);
    console.log(`🏢 แผนก: ${department?.name || 'ไม่ระบุ'}`);
    console.log(`📅 วันที่เข้าทำงาน: ${selectedEmployee.hireDate}`);
    console.log(`🟢 สถานะ: ${selectedEmployee.active ? '✅ ใช้งานอยู่' : '❌ ไม่ได้ใช้งาน'}`);
    console.log(`🕐 สร้างเมื่อ: ${selectedEmployee.createdAt || 'N/A'}`);
    console.log(`🔄 แก้ไขล่าสุด: ${selectedEmployee.updatedAt || 'N/A'}`);

    // ดู KPI ที่มอบหมาย
    try {
      const assignedKPIs = await this.staffKPIService.getStaffKPIs(selectedEmployee.id);
      if (assignedKPIs.length > 0) {
        console.log('\n🎯 KPI ที่มอบหมาย:');
        assignedKPIs.forEach((kpi: any, index: number) => {
          console.log(`  ${index + 1}. ${kpi.name} (น้ำหนัก: ${kpi.weight}%)`);
        });
      } else {
        console.log('\n⚠️  ยังไม่มีการมอบหมาย KPI');
      }
    } catch (error) {
      console.log('\n⚠️  ไม่สามารถดึงข้อมูล KPI');
    }
  }

  private async editStaff(): Promise<void> {
    const staff = await this.staffService.findAll();
    
    if (staff.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มีพนักงานในระบบ'));
      return;
    }

    const { selectedStaff } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedStaff',
        message: 'เลือกพนักงานที่ต้องการแก้ไข:',
        choices: staff.map(s => ({
          name: `${s.name} (${s.employeeId}) - ${s.position}`,
          value: s.id
        }))
      }
    ]);

    const selectedEmployee = staff.find(s => s.id === selectedStaff)!;
    const departments = await this.departmentService.findAll();
    
    console.log(chalk.bold.yellow(`\n✏️  แก้ไขข้อมูล: ${selectedEmployee.name}`));
    console.log('─'.repeat(50));

    const { name, email, position, departmentId, active } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'ชื่อ:',
        default: selectedEmployee.name,
        validate: (input) => input.trim() ? true : 'กรุณากรอกชื่อ'
      },
      {
        type: 'input',
        name: 'email',
        message: 'อีเมล:',
        default: selectedEmployee.email,
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(input) ? true : 'รูปแบบอีเมลไม่ถูกต้อง';
        }
      },
      {
        type: 'input',
        name: 'position',
        message: 'ตำแหน่ง:',
        default: selectedEmployee.position,
        validate: (input) => input.trim() ? true : 'กรุณากรอกตำแหน่ง'
      },
      {
        type: 'list',
        name: 'departmentId',
        message: 'แผนก:',
        choices: departments.map(dept => ({
          name: dept.name,
          value: dept.id
        })),
        default: selectedEmployee.departmentId
      },
      {
        type: 'confirm',
        name: 'active',
        message: 'สถานะการทำงาน:',
        default: selectedEmployee.active
      }
    ]);

    try {
      await this.staffService.update(selectedEmployee.id, {
        name: name.trim(),
        email: email.trim(),
        position: position.trim(),
        departmentId,
        active
      });
      
      console.log(chalk.green('✅ แก้ไขข้อมูลพนักงานสำเร็จ'));
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    }
  }

  private async viewStaffPerformance(): Promise<void> {
    const staff = await this.staffService.findAll();
    
    if (staff.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มีพนักงานในระบบ'));
      return;
    }

    const { selectedStaff } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedStaff',
        message: 'เลือกพนักงานที่ต้องการดูผลการประเมิน:',
        choices: staff.map(s => ({
          name: `${s.name} (${s.employeeId}) - ${s.position}`,
          value: s.id
        }))
      }
    ]);

    const { year, quarter } = await inquirer.prompt([
      {
        type: 'input',
        name: 'year',
        message: 'ปี (ครั้งปัจจุบัน):',
        default: new Date().getFullYear().toString(),
        validate: (input) => {
          const year = parseInt(input);
          return (year >= 2020 && year <= 2030) ? true : 'กรุณากรอกปีในช่วง 2020-2030';
        }
      },
      {
        type: 'list',
        name: 'quarter',
        message: 'ไตรมาส:',
        choices: [
          { name: 'ไตรมาสที่ 1 (มกราคม-มีนาคม)', value: 1 },
          { name: 'ไตรมาสที่ 2 (เมษายน-มิถุนายน)', value: 2 },
          { name: 'ไตรมาสที่ 3 (กรกฎาคม-กันยายน)', value: 3 },
          { name: 'ไตรมาสที่ 4 (ตุลาคม-ธันวาคม)', value: 4 }
        ],
        default: Math.ceil((new Date().getMonth() + 1) / 3)
      }
    ]);

    try {
      const summary = await this.evaluationService.calculateStaffSummary(
        selectedStaff,
        parseInt(year),
        quarter
      );
      
      const evaluations = await this.evaluationService.getStaffEvaluations(
        selectedStaff,
        parseInt(year),
        quarter
      );

      const selectedEmployee = staff.find(s => s.id === selectedStaff)!;

      console.log(chalk.bold.magenta('\n📊 ผลการประเมินรายบุคคล'));
      console.log('═'.repeat(60));
      console.log(`👤 พนักงาน: ${chalk.bold(selectedEmployee.name)}`);
      console.log(`📅 ช่วงเวลา: Q${quarter}/${year}`);
      console.log(`🏆 คะแนนรวม: ${this.reportService.formatPercentage(summary.percentageScore || 0)}`);
      console.log(`🏅 เกรด: ${chalk[this.reportService.getGradeColor(summary.grade || 'F')](summary.grade || 'F')}`);
      
      if (evaluations.length > 0) {
        console.log('\n📋 รายละเอียด KPI:');
        for (const evaluation of evaluations) {
          const kpi = await this.kpiService.findById(evaluation.kpiId);
          if (kpi) {
            console.log(`\n  • ${chalk.bold(kpi.name)}`);
            console.log(`    📊 คะแนน: ${this.reportService.formatScore(evaluation.score || 0)}`);
            console.log(`    📈 ผลคำนวณ: ${evaluation.calculatedValue || 0}`);
            console.log(`    🎯 เป้าหมาย: ${evaluation.targetValue || 'ไม่ระบุ'}`);
            if (evaluation.targetValue && evaluation.calculatedValue) {
              const achievement = (evaluation.calculatedValue / evaluation.targetValue) * 100;
              console.log(`    📈 ผลสำเร็จ: ${achievement.toFixed(1)}%`);
            }
          }
        }
      } else {
        console.log('\n⚠️  ไม่มีข้อมูลการประเมินในช่วงเวลานี้');
      }
    } catch (error: any) {
      console.error(chalk.red(`❌ ไม่สามารถดึงข้อมูลผลการประเมิน: ${error.message}`));
    }
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
          { name: '👁️  ดูข้อมูลรายละเอียด KPI', value: 'detail' },
          { name: '➕ เพิ่ม KPI ใหม่', value: 'add' },
          { name: '✏️  แก้ไข KPI', value: 'edit' },
          { name: '🧪 ทดสอบสูตรคำนวณ', value: 'test-formula' },
          { name: '📊 ดูสถิติการใช้งาน', value: 'analytics' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (kpiAction === 'back') return;

    switch (kpiAction) {
      case 'list':
        await this.listKPIs();
        break;
      case 'detail':
        await this.viewKPIDetail();
        break;
      case 'add':
        await this.addKPI();
        break;
      case 'edit':
        await this.editKPI();
        break;
      case 'test-formula':
        await this.testKPIFormula();
        break;
      case 'analytics':
        await this.viewKPIAnalytics();
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
      const statusIcon = kpi.active ? '✅' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${chalk.bold(kpi.name)}`);
      console.log(`   📝 ${kpi.description}`);
      console.log(`   ⚖️ น้ำหนัก: ${kpi.weight}%`);
      console.log(`   🎯 เป้าหมาย: ${kpi.targetValue || 'ไม่ระบุ'}`);
      console.log(`   🟢 สถานะ: ${kpi.active ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}`);
      if (index < kpis.length - 1) {
        console.log('');
      }
    });
  }

  private async viewKPIDetail(): Promise<void> {
    const kpis = await this.kpiService.findAll();
    
    if (kpis.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มี KPI ในระบบ'));
      return;
    }

    const { selectedKPI } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedKPI',
        message: 'เลือก KPI ที่ต้องการดูรายละเอียด:',
        choices: kpis.map(kpi => ({
          name: `${kpi.name} (น้ำหนัก: ${kpi.weight}%)`,
          value: kpi.id
        }))
      }
    ]);

    const selectedKPIData = kpis.find(k => k.id === selectedKPI)!;
    
    console.log(chalk.bold.blue('\n🎯 ข้อมูลรายละเอียด KPI'));
    console.log('═'.repeat(60));
    console.log(`🏷️  ชื่อ: ${chalk.bold(selectedKPIData.name)}`);
    console.log(`📝 คำอธิบาย: ${selectedKPIData.description}`);
    console.log(`⚖️  น้ำหนัก: ${selectedKPIData.weight}%`);
    console.log(`🎯 เป้าหมาย: ${selectedKPIData.targetValue || 'ไม่ระบุ'}`);
    console.log(`🟢 สถานะ: ${selectedKPIData.active ? '✅ ใช้งานอยู่' : '❌ ไม่ได้ใช้งาน'}`);
    console.log(`🕐 สร้างเมื่อ: ${selectedKPIData.createdAt || 'N/A'}`);
    console.log(`🔄 แก้ไขล่าสุด: ${selectedKPIData.updatedAt || 'N/A'}`);
    
    // แสดงสูตรคำนวณ
    console.log('\n🧪 สูตรคำนวณ:');
    if (selectedKPIData.formulaJson) {
      console.log(JSON.stringify(selectedKPIData.formulaJson, null, 2));
    } else {
      console.log('ไม่มีสูตรคำนวณ');
    }
    
    // แสดงเกณฑ์การให้คะแนน
    console.log('\n📉 เกณฑ์การให้คะแนน:');
    if (selectedKPIData.scoringCriteriaJson) {
      console.log(JSON.stringify(selectedKPIData.scoringCriteriaJson, null, 2));
    } else {
      console.log('ไม่มีเกณฑ์การให้คะแนน');
    }
    
    // แสดงโครงสร้างข้อมูล
    console.log('\n📊 โครงสร้างข้อมูล:');
    if (selectedKPIData.rawDataSchemaJson) {
      console.log(JSON.stringify(selectedKPIData.rawDataSchemaJson, null, 2));
    } else {
      console.log('ไม่มีโครงสร้างข้อมูล');
    }
  }

  private async editKPI(): Promise<void> {
    const kpis = await this.kpiService.findAll();
    
    if (kpis.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มี KPI ในระบบ'));
      return;
    }

    const { selectedKPI } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedKPI',
        message: 'เลือก KPI ที่ต้องการแก้ไข:',
        choices: kpis.map(kpi => ({
          name: `${kpi.name} (น้ำหนัก: ${kpi.weight}%)`,
          value: kpi.id
        }))
      }
    ]);

    const selectedKPIData = kpis.find(k => k.id === selectedKPI)!;
    
    console.log(chalk.bold.yellow(`\n✏️  แก้ไข KPI: ${selectedKPIData.name}`));
    console.log('─'.repeat(50));

    const { name, description, weight, targetValue, active } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'ชื่อ KPI:',
        default: selectedKPIData.name,
        validate: (input) => input.trim() ? true : 'กรุณากรอกชื่อ KPI'
      },
      {
        type: 'input',
        name: 'description',
        message: 'คำอธิบาย:',
        default: selectedKPIData.description,
        validate: (input) => input.trim() ? true : 'กรุณากรอกคำอธิบาย'
      },
      {
        type: 'number',
        name: 'weight',
        message: 'น้ำหนัก (0.1-100%):',
        default: selectedKPIData.weight,
        validate: (input) => {
          if (isNaN(input) || input < 0.1 || input > 100) {
            return 'น้ำหนักต้องอยู่ระหว่าง 0.1-100%';
          }
          return true;
        }
      },
      {
        type: 'number',
        name: 'targetValue',
        message: 'เป้าหมาย (เว้นว่างหากไม่มี):',
        default: selectedKPIData.targetValue || undefined
      },
      {
        type: 'confirm',
        name: 'active',
        message: 'สถานะการใช้งาน:',
        default: selectedKPIData.active
      }
    ]);

    try {
      await this.kpiService.update(selectedKPI, {
        name: name.trim(),
        description: description.trim(),
        weight,
        targetValue: targetValue || null,
        active
      });
      
      console.log(chalk.green('✅ แก้ไข KPI สำเร็จ'));
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    }
  }

  private async testKPIFormula(): Promise<void> {
    const kpis = await this.kpiService.findAll();
    
    if (kpis.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มี KPI ในระบบ'));
      return;
    }

    const kpisWithFormula = kpis.filter(kpi => kpi.formulaJson && kpi.active);
    
    if (kpisWithFormula.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มี KPI ที่มีสูตรคำนวณและใช้งานอยู่'));
      return;
    }

    const { selectedKPI } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedKPI',
        message: 'เลือก KPI ที่ต้องการทดสอบสูตร:',
        choices: kpisWithFormula.map(kpi => ({
          name: `${kpi.name} (น้ำหนัก: ${kpi.weight}%)`,
          value: kpi.id
        }))
      }
    ]);

    const selectedKPIData = kpisWithFormula.find(k => k.id === selectedKPI)!;
    
    console.log(chalk.bold.blue(`\n🧪 ทดสอบสูตรคำนวณ: ${selectedKPIData.name}`));
    console.log('─'.repeat(50));
    
    try {
      // Note: testFormula method needs to be implemented in KPIService
      console.log(chalk.yellow('🚧 คุณสมบัติการทดสอบสูตรยังอยู่ในช่วงพัฒนา'));
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาดในการทดสอบ: ${error.message}`));
    }
  }

  private async viewKPIAnalytics(): Promise<void> {
    const kpis = await this.kpiService.findAll();
    
    if (kpis.length === 0) {
      console.log(chalk.yellow('📝 ยังไม่มี KPI ในระบบ'));
      return;
    }

    console.log(chalk.bold.magenta('\n📊 สถิติการใช้งาน KPI'));
    console.log('═'.repeat(60));
    
    const activeKpis = kpis.filter(kpi => kpi.active);
    const inactiveKpis = kpis.filter(kpi => !kpi.active);
    
    console.log(`📊 จำนวน KPI ทั้งหมด: ${kpis.length}`);
    console.log(`✅ KPI ที่ใช้งานอยู่: ${activeKpis.length}`);
    console.log(`❌ KPI ที่ไม่ได้ใช้งาน: ${inactiveKpis.length}`);
    
    // แสดงการกระจายน้ำหนัก
    const totalWeight = activeKpis.reduce((sum, kpi) => sum + kpi.weight, 0);
    console.log(`\n⚖️  น้ำหนักรวมของ KPI ที่ใช้งาน: ${totalWeight.toFixed(1)}%`);
    
    if (totalWeight !== 100) {
      const difference = 100 - totalWeight;
      if (difference > 0) {
        console.log(chalk.yellow(`⚠️  น้ำหนักยังขาดอีก: ${difference.toFixed(1)}%`));
      } else {
        console.log(chalk.red(`❌ น้ำหนักเกิน 100%: ${Math.abs(difference).toFixed(1)}%`));
      }
    } else {
      console.log(chalk.green('✅ น้ำหนักรวมเท่ากับ 100% ถูกต้อง'));
    }
    
    // แสดง KPI ที่มีน้ำหนักสูงสุด
    const topKpis = activeKpis.sort((a, b) => b.weight - a.weight).slice(0, 5);
    console.log('\n🏆 KPI ที่มีน้ำหนักสูงสุด:');
    topKpis.forEach((kpi, index) => {
      console.log(`  ${index + 1}. ${kpi.name} - ${kpi.weight}%`);
    });
    
    // แสดงสาระข้อมูลสูตรและเกณฑ์
    const kpisWithFormula = kpis.filter(kpi => kpi.formulaJson).length;
    const kpisWithCriteria = kpis.filter(kpi => kpi.scoringCriteriaJson).length;
    const kpisWithSchema = kpis.filter(kpi => kpi.rawDataSchemaJson).length;
    
    console.log('\n📊 สาระข้อมูลความสมบูรณ์:');
    console.log(`  🧪 KPI ที่มีสูตรคำนวณ: ${kpisWithFormula}/${kpis.length}`);
    console.log(`  📉 KPI ที่มีเกณฑ์ให้คะแนน: ${kpisWithCriteria}/${kpis.length}`);
    console.log(`  📊 KPI ที่มีโครงสร้างข้อมูล: ${kpisWithSchema}/${kpis.length}`);
    
    const completionPercentage = ((kpisWithFormula + kpisWithCriteria + kpisWithSchema) / (kpis.length * 3) * 100);
    console.log(`\n📊 ระดับความสมบูรณ์โดยรวม: ${completionPercentage.toFixed(1)}%`);
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

    const { entryType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'entryType',
        message: 'เลือกประเภทการบันทึก:',
        choices: [
          { name: '👤 บันทึกรายบุคคล', value: 'individual' },
          { name: '👥 บันทึกแบบกลุ่ม (หลายคน)', value: 'bulk' },
          { name: '🏢 บันทึกทั้งแผนก', value: 'department' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (entryType === 'back') return;

    switch (entryType) {
      case 'individual':
        await this.handleIndividualDataEntry();
        break;
      case 'bulk':
        await this.handleBulkDataEntry();
        break;
      case 'department':
        await this.handleDepartmentDataEntry();
        break;
    }
  }

  private async handleIndividualDataEntry(): Promise<void> {
    console.log(chalk.bold.blue('\n👤 บันทึกข้อมูลรายบุคคล'));
    console.log('─'.repeat(30));

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

  private async handleAdvancedAnalytics(): Promise<void> {
    console.log(chalk.bold.magenta('\n📊 วิเคราะห์ข้อมูลและประสิทธิภาพ'));
    console.log('─'.repeat(30));

    const { analyticsAction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'analyticsAction',
        message: 'เลือกประเภทการวิเคราะห์:',
        choices: [
          { name: '📈 ดูแนวโน้มผลการประเมิน', value: 'trends' },
          { name: '🏆 เปรียบเทียบผลการประเมิน', value: 'compare' },
          { name: '📉 สถิติความสมบูรณ์ข้อมูล', value: 'completeness' },
          { name: '🔍 ค้นหาข้อมูลขั้นสูง', value: 'search' },
          { name: '📊 ดาสห์บอร์ดรวม', value: 'dashboard' },
          { name: '💾 ส่งออกข้อมูล', value: 'export' },
          { name: '🔙 กลับ', value: 'back' }
        ]
      }
    ]);

    if (analyticsAction === 'back') return;

    switch (analyticsAction) {
      case 'trends':
        await this.viewPerformanceTrends();
        break;
      case 'compare':
        await this.comparePerformance();
        break;
      case 'completeness':
        await this.viewDataCompleteness();
        break;
      case 'search':
        await this.searchAdvanced();
        break;
      case 'dashboard':
        await this.showDashboard();
        break;
      case 'export':
        await this.exportData();
        break;
    }
  }

  private async viewPerformanceTrends(): Promise<void> {
    console.log(chalk.bold.cyan('\n📈 แนวโน้มผลการประเมิน'));
    console.log('─'.repeat(50));

    const departments = await this.departmentService.findAll();
    if (departments.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มีแผนกในระบบ'));
      return;
    }

    const { departmentId, year } = await inquirer.prompt([
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
        name: 'year',
        message: 'ปีที่ต้องการวิเคราะห์:',
        default: new Date().getFullYear().toString(),
        validate: (input) => {
          const year = parseInt(input);
          return (year >= 2020 && year <= 2030) ? true : 'กรุณากรอกปีในช่วง 2020-2030';
        }
      }
    ]);

    try {
      const yearInt = parseInt(year);
      const quarterlyData: Array<{
        quarter: number;
        averageScore: number;
        staffCount: number;
        topPerformer: string;
      }> = [];
      
      console.log(chalk.blue('\n🔄 กำลังรวบรวมข้อมูลรายไตรมาส...'));
      
      for (let quarter = 1; quarter <= 4; quarter++) {
        try {
          const report = await this.reportService.generateQuarterlyReport(departmentId, yearInt, quarter);
          quarterlyData.push({
            quarter,
            averageScore: report.departmentSummary.averageScore,
            staffCount: report.departmentSummary.totalStaff,
            topPerformer: report.departmentSummary.topPerformers[0]?.name || 'ไม่มี'
          });
        } catch (error) {
          quarterlyData.push({ quarter, averageScore: 0, staffCount: 0, topPerformer: 'ไม่ข้อมูล' });
        }
      }

      console.log(chalk.bold.green('\n📈 แนวโน้มผลการประเมินรายไตรมาส'));
      console.log('═'.repeat(70));

      quarterlyData.forEach((data, index) => {
        const trendIcon = index > 0 ? 
          (data.averageScore > (quarterlyData[index - 1]?.averageScore ?? 0) ? '📈' : 
           data.averageScore < (quarterlyData[index - 1]?.averageScore ?? 0) ? '📉' : '➡️') : '🏁';
        
        console.log(`Q${data.quarter}: ${trendIcon} คะแนนเฉลี่ย: ${data.averageScore.toFixed(1)}% | พนักงาน: ${data.staffCount} คน | ผู้นำ: ${data.topPerformer}`);
      });

      // คำนวณแนวโน้มโดยรวม
      const validQuarters = quarterlyData.filter(d => d.averageScore > 0);
      if (validQuarters.length >= 2) {
        const firstHalf = validQuarters.slice(0, Math.floor(validQuarters.length / 2));
        const secondHalf = validQuarters.slice(Math.floor(validQuarters.length / 2));
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.averageScore, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.averageScore, 0) / secondHalf.length;
        
        console.log('\n📉 สรุปแนวโน้ม:');
        if (secondAvg > firstAvg + 2) {
          console.log(chalk.green('📈 ผลการประเมินกำลังปรับปรุงอย่างต่อเนื่อง'));
        } else if (secondAvg < firstAvg - 2) {
          console.log(chalk.red('📉 ผลการประเมินกำลังลดลง'));
        } else {
          console.log(chalk.yellow('➡️  ผลการประเมินคงที่'));
        }
      }
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    }
  }

  private async comparePerformance(): Promise<void> {
    console.log(chalk.bold.cyan('\n🏆 เปรียบเทียบผลการประเมิน'));
    console.log('─'.repeat(50));

    const { comparisonType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'comparisonType',
        message: 'เลือกประเภทการเปรียบเทียบ:',
        choices: [
          { name: '🏢 เปรียบเทียบระหว่างแผนก', value: 'departments' },
          { name: '👥 เปรียบเทียบระหว่างพนักงาน', value: 'staff' },
          { name: '🎯 เปรียบเทียบระหว่าง KPI', value: 'kpis' }
        ]
      }
    ]);

    switch (comparisonType) {
      case 'departments':
        await this.compareDepartments();
        break;
      case 'staff':
        await this.compareStaff();
        break;
      case 'kpis':
        await this.compareKPIs();
        break;
    }
  }

  private async compareDepartments(): Promise<void> {
    const departments = await this.departmentService.findAll();
    if (departments.length < 2) {
      console.log(chalk.yellow('⚠️  ต้องมีอย่างน้อย 2 แผนกเพื่อเปรียบเทียบ'));
      return;
    }

    const { year, quarter } = await inquirer.prompt([
      {
        type: 'input',
        name: 'year',
        message: 'ปี:',
        default: new Date().getFullYear().toString()
      },
      {
        type: 'list',
        name: 'quarter',
        message: 'ไตรมาส:',
        choices: [1, 2, 3, 4].map(q => ({ name: `Q${q}`, value: q }))
      }
    ]);

    console.log(chalk.bold.magenta('\n🏢 การเปรียบเทียบระหว่างแผนก'));
    console.log('═'.repeat(60));

    const departmentScores = [];
    for (const dept of departments) {
      try {
        const report = await this.reportService.generateQuarterlyReport(dept.id, parseInt(year), quarter);
        departmentScores.push({
          name: dept.name,
          score: report.departmentSummary.averageScore,
          staffCount: report.departmentSummary.totalStaff
        });
      } catch (error) {
        departmentScores.push({ name: dept.name, score: 0, staffCount: 0 });
      }
    }

    departmentScores.sort((a, b) => b.score - a.score);
    
    departmentScores.forEach((dept, index) => {
      const rank = index + 1;
      const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      const scoreColor = dept.score >= 80 ? 'green' : dept.score >= 60 ? 'yellow' : 'red';
      
      console.log(`${rankIcon} ${chalk.bold(dept.name)}: ${chalk[scoreColor](dept.score.toFixed(1) + '%')} (พนักงาน ${dept.staffCount} คน)`);
    });
  }

  private async compareStaff(): Promise<void> {
    // Implementation for staff comparison
    console.log(chalk.yellow('🚧 คุณสมบัตินี้ยังอยู่ในช่วงพัฒนา'));
  }

  private async compareKPIs(): Promise<void> {
    // Implementation for KPI comparison
    console.log(chalk.yellow('🚧 คุณสมบัตินี้ยังอยู่ในช่วงพัฒนา'));
  }

  private async viewDataCompleteness(): Promise<void> {
    console.log(chalk.bold.cyan('\n📉 สถิติความสมบูรณ์ข้อมูล'));
    console.log('─'.repeat(50));

    const departments = await this.departmentService.findAll();
    const staff = await this.staffService.findAll();
    const kpis = await this.kpiService.findAll();
    
    console.log('📊 สรุปการตั้งค่าระบบ:');
    console.log(`  🏢 แผนก: ${departments.length}`);
    console.log(`  👥 พนักงาน: ${staff.length} (ใช้งาน: ${staff.filter(s => s.active).length})`);
    console.log(`  🎯 KPI: ${kpis.length} (ใช้งาน: ${kpis.filter(k => k.active).length})`);
    
    // ตรวจสอบความสมบูรณ์ของข้อมูล
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    
    console.log(`\n📅 ความสมบูรณ์ข้อมูล Q${currentQuarter}/${currentYear}:`);
    
    for (const dept of departments) {
      const deptStaff = staff.filter(s => s.departmentId === dept.id && s.active);
      let dataEntryCount = 0;
      let totalExpected = deptStaff.length * kpis.filter(k => k.active).length;
      
      for (const employee of deptStaff) {
        try {
          const summary = await this.evaluationService.calculateStaffSummary(
            employee.id, currentYear, currentQuarter
          );
          if (summary) dataEntryCount++;
        } catch (error) {
          // ไม่มีข้อมูล
        }
      }
      
      const completeness = totalExpected > 0 ? (dataEntryCount / totalExpected * 100) : 100;
      const completenessColor = completeness >= 80 ? 'green' : completeness >= 50 ? 'yellow' : 'red';
      
      console.log(`  ${chalk.bold(dept.name)}: ${chalk[completenessColor](completeness.toFixed(1) + '%')} (${dataEntryCount}/${totalExpected})`);
    }
  }

  private async searchAdvanced(): Promise<void> {
    console.log(chalk.bold.cyan('\n🔍 ค้นหาข้อมูลขั้นสูง'));
    console.log('─'.repeat(50));

    const { searchType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'searchType',
        message: 'เลือกประเภทการค้นหา:',
        choices: [
          { name: '👥 ค้นหาพนักงาน', value: 'staff' },
          { name: '🎯 ค้นหา KPI', value: 'kpi' },
          { name: '📋 ค้นหาข้อมูลการประเมิน', value: 'evaluations' }
        ]
      }
    ]);

    const { searchTerm } = await inquirer.prompt([
      {
        type: 'input',
        name: 'searchTerm',
        message: 'กรอกคำค้นหา:',
        validate: (input) => input.trim().length > 0 || 'กรุณากรอกคำค้นหา'
      }
    ]);

    const term = searchTerm.toLowerCase().trim();
    
    switch (searchType) {
      case 'staff':
        const staff = await this.staffService.findAll();
        const matchingStaff = staff.filter(s => 
          s.name.toLowerCase().includes(term) || 
          s.email.toLowerCase().includes(term) ||
          s.employeeId.toLowerCase().includes(term) ||
          (s.position?.toLowerCase().includes(term) ?? false)
        );
        
        console.log(chalk.bold.green(`\n🔍 พบพนักงาน ${matchingStaff.length} ราย`));
        matchingStaff.forEach((s, index) => {
          console.log(`${index + 1}. ${chalk.bold(s.name)} (${s.employeeId}) - ${s.position || 'N/A'}`);
          console.log(`   📧 ${s.email}`);
        });
        break;
        
      case 'kpi':
        const kpis = await this.kpiService.findAll();
        const matchingKPIs = kpis.filter(k => 
          k.name.toLowerCase().includes(term) || 
          (k.description?.toLowerCase().includes(term) ?? false)
        );
        
        console.log(chalk.bold.green(`\n🔍 พบ KPI ${matchingKPIs.length} ราย`));
        matchingKPIs.forEach((k, index) => {
          console.log(`${index + 1}. ${chalk.bold(k.name)} (น้ำหนัก: ${k.weight}%)`);
          console.log(`   📝 ${k.description || 'N/A'}`);
        });
        break;
        
      case 'evaluations':
        console.log(chalk.yellow('🚧 การค้นหาข้อมูลการประเมินยังอยู่ในช่วงพัฒนา'));
        break;
    }
  }

  private async showDashboard(): Promise<void> {
    console.log(chalk.bold.magenta('\n📊 ดาสห์บอร์ดรวม'));
    console.log('═'.repeat(60));

    try {
      // สถิติโดยรวม
      const departments = await this.departmentService.findAll();
      const staff = await this.staffService.findAll();
      const kpis = await this.kpiService.findAll();
      
      console.log('📊 สถิติรวมระบบ:');
      console.log(`  🏢 แผนก: ${departments.length}`);
      console.log(`  👥 พนักงาน: ${staff.length} (ใช้งาน: ${staff.filter(s => s.active).length})`);
      console.log(`  🎯 KPI: ${kpis.length} (ใช้งาน: ${kpis.filter(k => k.active).length})`);
      
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      
      console.log(`\n📅 ข้อมูลปัจจุบัน (Q${currentQuarter}/${currentYear}):`);
      
      // แสดงข้อมูลแต่ละแผนก
      for (const dept of departments.slice(0, 3)) { // แสดงแค่ 3 แผนกแรก
        try {
          const report = await this.reportService.generateQuarterlyReport(dept.id, currentYear, currentQuarter);
          const avgScore = report.departmentSummary.averageScore;
          const scoreColor = avgScore >= 80 ? 'green' : avgScore >= 60 ? 'yellow' : 'red';
          
          console.log(`  ${chalk.bold(dept.name)}: ${chalk[scoreColor](avgScore.toFixed(1) + '%')} (พนักงาน ${report.departmentSummary.totalStaff} คน)`);
        } catch (error) {
          console.log(`  ${chalk.bold(dept.name)}: ${chalk.gray('ไม่มีข้อมูล')}`);
        }
      }
      
      console.log('\n📈 แนะนำการปรับปรุง:');
      console.log('• เพิ่มการบันทึกข้อมูลสำหรับไตรมาสปัจจุบัน');
      console.log('• ปรับปรุงการคำนวณผลการประเมินให้เป็นปัจจุบัน');
      console.log('• เพิ่มการวิเคราะห์และรายงานเปรียบเทียบ');
      
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    }
  }

  private async exportData(): Promise<void> {
    console.log(chalk.bold.cyan('\n💾 ส่งออกข้อมูล'));
    console.log('─'.repeat(50));

    const { exportType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'exportType',
        message: 'เลือกประเภทข้อมูลที่ต้องการส่งออก:',
        choices: [
          { name: '📊 รายงานไตรมาส (CSV)', value: 'quarterly-csv' },
          { name: '📊 รายงานประจำปี (JSON)', value: 'annual-json' },
          { name: '👥 ข้อมูลพนักงาน (CSV)', value: 'staff-csv' },
          { name: '🎯 ข้อมูล KPI (JSON)', value: 'kpi-json' }
        ]
      }
    ]);

    console.log(chalk.yellow('🚧 คุณสมบัติการส่งออกข้อมูลยังอยู่ในช่วงพัฒนา'));
    console.log('ไฟล์จะถูกบันทึกในโฟลเดอร์ exports/ ของโปรเจคต์');
  }

  private async handleBulkDataEntry(): Promise<void> {
    console.log(chalk.bold.magenta('\n👥 บันทึกข้อมูลแบบกลุ่ม'));
    console.log('─'.repeat(40));

    const { bulkType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'bulkType',
        message: 'เลือกประเภทการบันทึกแบบกลุ่ม:',
        choices: [
          { name: '🎯 บันทึก KPI เดียวสำหรับหลายคน', value: 'same-kpi' },
          { name: '👥 บันทึกหลาย KPI สำหรับคนเดียว', value: 'same-person' },
          { name: '📊 มอบหมาย KPI แบบกลุ่ม', value: 'assign-bulk' }
        ]
      }
    ]);

    switch (bulkType) {
      case 'same-kpi':
        await this.handleSameKPIBulkEntry();
        break;
      case 'same-person':
        await this.handleSamePersonBulkEntry();
        break;
      case 'assign-bulk':
        await this.handleBulkKPIAssignment();
        break;
    }
  }

  private async handleSameKPIBulkEntry(): Promise<void> {
    console.log(chalk.bold.cyan('\n🎯 บันทึก KPI เดียวสำหรับหลายคน'));
    console.log('─'.repeat(50));

    // เลือก KPI
    const kpis = await this.kpiService.findAll();
    const activeKpis = kpis.filter(kpi => kpi.active);
    
    if (activeKpis.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มี KPI ที่ใช้งานอยู่'));
      return;
    }

    const { kpiId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'kpiId',
        message: 'เลือก KPI:',
        choices: activeKpis.map(kpi => ({
          name: `${kpi.name} (น้ำหนัก: ${kpi.weight}%)`,
          value: kpi.id
        }))
      }
    ]);

    // เลือกพนักงานหลายคน
    const staff = await this.staffService.findAll();
    const activeStaff = staff.filter(s => s.active);
    
    if (activeStaff.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มีพนักงานที่ใช้งานอยู่'));
      return;
    }

    const { selectedStaff } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedStaff',
        message: 'เลือกพนักงาน (หลายคน):',
        choices: activeStaff.map(s => ({
          name: `${s.name} (${s.employeeId}) - ${s.position}`,
          value: s.id
        })),
        validate: (input) => input.length > 0 || 'กรุณาเลือกพนักงานอย่างน้อย 1 คน'
      }
    ]);

    // เลือกช่วงเวลา
    const { year, quarter } = await inquirer.prompt([
      {
        type: 'input',
        name: 'year',
        message: 'ปี:',
        default: new Date().getFullYear().toString(),
        validate: (input) => {
          const year = parseInt(input);
          return (year >= 2020 && year <= 2030) ? true : 'กรุณากรอกปีในช่วง 2020-2030';
        }
      },
      {
        type: 'list',
        name: 'quarter',
        message: 'ไตรมาส:',
        choices: [
          { name: 'ไตรมาสที่ 1', value: 1 },
          { name: 'ไตรมาสที่ 2', value: 2 },
          { name: 'ไตรมาสที่ 3', value: 3 },
          { name: 'ไตรมาสที่ 4', value: 4 }
        ],
        default: Math.ceil((new Date().getMonth() + 1) / 3)
      }
    ]);

    console.log(chalk.blue(`\n🔄 กำลังบันทึกข้อมูลสำหรับ ${selectedStaff.length} คน...`));

    let successCount = 0;
    let errorCount = 0;

    for (const staffId of selectedStaff) {
      const employee = activeStaff.find(s => s.id === staffId);
      console.log(chalk.gray(`\n👤 กำลังบันทึกสำหรับ: ${employee?.name}`));
      
      // รับข้อมูลสำหรับ KPI นี้
      console.log('กรุณากรอกข้อมูลสำหรับ KPI นี้:');
      
      // ให้กรอกข้อมูลแบบง่าย (สำหรับ demo)
      const { dataValue } = await inquirer.prompt([
        {
          type: 'number',
          name: 'dataValue',
          message: 'ค่าข้อมูล:',
          validate: (input) => !isNaN(input) || 'กรุณากรอกตัวเลข'
        }
      ]);

      try {
        await this.dataEntryService.createEntry({
          staffId,
          kpiId,
          periodYear: parseInt(year),
          periodQuarter: quarter,
          dataValues: { value: dataValue }
        });
        
        successCount++;
        console.log(chalk.green('✅ บันทึกสำเร็จ'));
      } catch (error: any) {
        errorCount++;
        console.log(chalk.red(`❌ ผิดพลาด: ${error.message}`));
      }
    }

    console.log(chalk.bold.green(`\n🏆 สรุปผลการบันทึกแบบกลุ่ม:`));
    console.log(`✅ บันทึกสำเร็จ: ${successCount} รายการ`);
    console.log(`❌ ผิดพลาด: ${errorCount} รายการ`);
  }

  private async handleSamePersonBulkEntry(): Promise<void> {
    console.log(chalk.yellow('🚧 คุณสมบัตินี้ยังอยู่ในช่วงพัฒนา'));
  }

  private async handleBulkKPIAssignment(): Promise<void> {
    console.log(chalk.bold.magenta('\n📊 มอบหมาย KPI แบบกลุ่ม'));
    console.log('─'.repeat(40));

    const { assignmentType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'assignmentType',
        message: 'เลือกประเภทการมอบหมาย:',
        choices: [
          { name: '🏢 มอบหมาย KPI ให้ทั้งแผนก', value: 'department' },
          { name: '👥 มอบหมาย KPI ให้พนักงานหลายคน', value: 'multiple-staff' },
          { name: '🎯 มอบหมาย KPI หลายตัวให้คนเดียว', value: 'multiple-kpis' }
        ]
      }
    ]);

    switch (assignmentType) {
      case 'department':
        await this.assignKPIsToDepartment();
        break;
      case 'multiple-staff':
        await this.assignKPIsToMultipleStaff();
        break;
      case 'multiple-kpis':
        await this.assignMultipleKPIsToStaff();
        break;
    }
  }

  private async assignKPIsToDepartment(): Promise<void> {
    const departments = await this.departmentService.findAll();
    if (departments.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มีแผนกในระบบ'));
      return;
    }

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'เลือกแผนก:',
        choices: departments.map(dept => ({
          name: dept.name,
          value: dept.id
        }))
      }
    ]);

    const kpis = await this.kpiService.findAll();
    const activeKpis = kpis.filter(kpi => kpi.active);
    
    if (activeKpis.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มี KPI ที่ใช้งานอยู่'));
      return;
    }

    const { selectedKPIs } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedKPIs',
        message: 'เลือก KPI ที่ต้องการมอบหมาย:',
        choices: activeKpis.map(kpi => ({
          name: `${kpi.name} (น้ำหนัก: ${kpi.weight}%)`,
          value: kpi.id
        })),
        validate: (input) => input.length > 0 || 'กรุณาเลือก KPI อย่างน้อย 1 ตัว'
      }
    ]);

    const departmentStaff = await this.staffService.findByDepartment(departmentId);
    const activeStaff = departmentStaff.filter(s => s.active);
    
    if (activeStaff.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มีพนักงานที่ใช้งานอยู่ในแผนกนี้'));
      return;
    }

    console.log(chalk.blue(`\n🔄 กำลังมอบหมาย ${selectedKPIs.length} KPI ให้ ${activeStaff.length} คน...`));

    let successCount = 0;
    let errorCount = 0;

    for (const staffId of activeStaff.map(s => s.id)) {
      for (const kpiId of selectedKPIs) {
        try {
          await this.staffKPIService.assignKPI({ staffId, kpiId });
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.log(chalk.red(`❌ ผิดพลาดในการมอบหมาย: ${error.message}`));
        }
      }
    }

    console.log(chalk.bold.green(`\n🏆 สรุปผลการมอบหมายแบบกลุ่ม:`));
    console.log(`✅ มอบหมายสำเร็จ: ${successCount} รายการ`);
    console.log(`❌ ผิดพลาด: ${errorCount} รายการ`);
  }

  private async assignKPIsToMultipleStaff(): Promise<void> {
    console.log(chalk.yellow('🚧 คุณสมบัตินี้ยังอยู่ในช่วงพัฒนา'));
  }

  private async assignMultipleKPIsToStaff(): Promise<void> {
    console.log(chalk.yellow('🚧 คุณสมบัตินี้ยังอยู่ในช่วงพัฒนา'));
  }

  private async handleDepartmentDataEntry(): Promise<void> {
    console.log(chalk.bold.green('\n🏢 บันทึกข้อมูลทั้งแผนก'));
    console.log('─'.repeat(40));

    const departments = await this.departmentService.findAll();
    if (departments.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มีแผนกในระบบ'));
      return;
    }

    const { departmentId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'departmentId',
        message: 'เลือกแผนก:',
        choices: departments.map(dept => ({
          name: dept.name,
          value: dept.id
        }))
      }
    ]);

    const departmentStaff = await this.staffService.findByDepartment(departmentId);
    const activeStaff = departmentStaff.filter(s => s.active);
    
    if (activeStaff.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่มีพนักงานที่ใช้งานอยู่ในแผนกนี้'));
      return;
    }

    console.log(chalk.blue(`\n👥 พบพนักงานในแผนก: ${activeStaff.length} คน`));
    activeStaff.forEach((staff, index) => {
      console.log(`  ${index + 1}. ${staff.name} (${staff.employeeId})`);
    });

    const { confirmDepartmentEntry } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmDepartmentEntry',
        message: 'ต้องการบันทึกข้อมูลสำหรับพนักงานทั้งหมดหรือไม่?',
        default: false
      }
    ]);

    if (!confirmDepartmentEntry) {
      console.log(chalk.gray('ยกเลิกการบันทึกข้อมูลทั้งแผนก'));
      return;
    }

    console.log(chalk.yellow('🚧 คุณสมบัติการบันทึกข้อมูลทั้งแผนกยังอยู่ในช่วงพัฒนา'));
  }
}