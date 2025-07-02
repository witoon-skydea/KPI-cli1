import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { DataEntryService } from '../../core/services/DataEntryService.js';
import { StaffService } from '../../core/services/StaffService.js';
import { KPIService } from '../../core/services/KPIService.js';
import { DepartmentService } from '../../core/services/DepartmentService.js';
import { EvaluationService } from '../../core/services/EvaluationService.js';
import { closeDatabase } from '../../database/connection.js';

const dataEntryService = new DataEntryService();
const staffService = new StaffService();
const kpiService = new KPIService();
const departmentService = new DepartmentService();
const evaluationService = new EvaluationService();

export const dataCommand = new Command('data')
  .description('Manage raw data entries');

dataCommand
  .command('entry')
  .description('Enter raw data for KPI calculations')
  .option('-s, --staff <id>', 'Staff ID')
  .option('-k, --kpi <id>', 'KPI ID')
  .option('-y, --year <year>', 'Year (default: current year)')
  .option('-q, --quarter <quarter>', 'Quarter (1-4, default: current quarter)')
  .action(async (options) => {
    try {
      await handleDataEntry(options);
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    } finally {
      closeDatabase();
    }
  });

dataCommand
  .command('list')
  .description('List raw data entries')
  .option('-s, --staff <id>', 'Filter by staff ID')
  .option('-k, --kpi <id>', 'Filter by KPI ID')
  .option('-d, --department <id>', 'Filter by department ID')
  .option('-y, --year <year>', 'Filter by year')
  .option('-q, --quarter <quarter>', 'Filter by quarter')
  .action(async (options) => {
    try {
      await handleDataList(options);
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    } finally {
      closeDatabase();
    }
  });

async function handleDataEntry(options: any) {
  console.log(chalk.bold.cyan('📊 ระบบบันทึกข้อมูล KPI'));
  console.log(chalk.cyan('═'.repeat(50)));

  let staffId = options.staff;
  let kpiId = options.kpi;
  const year = options.year || new Date().getFullYear();
  const quarter = options.quarter || Math.ceil((new Date().getMonth() + 1) / 3);

  // เลือกแผนกก่อน (ถ้าไม่ระบุพนักงาน)
  if (!staffId) {
    const departments = await departmentService.findAll();
    if (departments.length === 0) {
      console.log(chalk.red('❌ ไม่พบแผนกในระบบ'));
      return;
    }

    const { selectedDepartment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDepartment',
        message: 'เลือกแผนก:',
        choices: departments.map(dept => ({
          name: `${dept.name} (${dept.description || ''})`,
          value: dept.id
        }))
      }
    ]);

    // เลือกพนักงาน
    const staff = await staffService.findByDepartment(selectedDepartment);
    if (staff.length === 0) {
      console.log(chalk.red('❌ ไม่พบพนักงานในแผนกนี้'));
      return;
    }

    const { selectedStaff } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedStaff',
        message: 'เลือกพนักงาน:',
        choices: staff.map(s => ({
          name: `${s.name} (${s.position}) - ${s.email}`,
          value: s.id
        }))
      }
    ]);
    staffId = selectedStaff;
  }

  // เลือก KPI
  if (!kpiId) {
    const kpis = await kpiService.findAll();
    const activeKpis = kpis.filter(kpi => kpi.active);
    
    if (activeKpis.length === 0) {
      console.log(chalk.red('❌ ไม่พบ KPI ที่ใช้งานอยู่'));
      return;
    }

    const { selectedKpi } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedKpi',
        message: 'เลือก KPI:',
        choices: activeKpis.map(kpi => ({
          name: `${kpi.name} (น้ำหนัก: ${kpi.weight}%)`,
          value: kpi.id
        }))
      }
    ]);
    kpiId = selectedKpi;
  }

  // ตรวจสอบข้อมูลที่มีอยู่
  const existingData = await dataEntryService.findEntry(staffId, kpiId, year, quarter);
  if (existingData) {
    console.log(chalk.yellow(`⚠️  มีข้อมูลสำหรับ KPI นี้ในไตรมาส ${quarter}/${year} แล้ว`));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'ต้องการทำอะไร:',
        choices: [
          { name: '📝 แก้ไขข้อมูลเดิม', value: 'update' },
          { name: '👁️  ดูข้อมูลเดิม', value: 'view' },
          { name: '❌ ยกเลิก', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'cancel') {
      console.log(chalk.gray('ยกเลิกการบันทึกข้อมูล'));
      return;
    }

    if (action === 'view') {
      console.log(chalk.blue('\n📋 ข้อมูลปัจจุบัน:'));
      console.log(JSON.stringify(existingData.dataValuesJson, null, 2));
      return;
    }
  }

  // ดึงข้อมูล KPI เพื่อดูโครงสร้างข้อมูล
  const kpi = await kpiService.findById(kpiId);
  if (!kpi) {
    console.log(chalk.red('❌ ไม่พบ KPI ที่ระบุ'));
    return;
  }

  console.log(chalk.blue(`\n📊 บันทึกข้อมูลสำหรับ KPI: ${kpi.name}`));
  console.log(chalk.gray(`📝 คำอธิบาย: ${kpi.description}`));
  console.log(chalk.gray(`📅 ไตรมาส: ${quarter}/${year}`));

  // รับข้อมูลจากผู้ใช้
  const rawDataSchema = kpi.rawDataSchemaJson as Record<string, any>;
  const dataValues: Record<string, unknown> = {};

  if (rawDataSchema && rawDataSchema.fields) {
    console.log(chalk.yellow('\n📝 กรุณากรอกข้อมูล:'));
    
    for (const field of rawDataSchema.fields) {
      const { value } = await inquirer.prompt([
        {
          type: field.type === 'number' ? 'number' : 'input',
          name: 'value',
          message: `${field.label} (${field.name}):`,
          validate: (input) => {
            if (field.required && !input && input !== 0) {
              return 'กรุณากรอกข้อมูลนี้';
            }
            if (field.type === 'number' && isNaN(Number(input))) {
              return 'กรุณากรอกตัวเลข';
            }
            return true;
          }
        }
      ]);
      dataValues[field.name] = field.type === 'number' ? Number(value) : value;
    }
  } else {
    // ถ้าไม่มี schema ให้กรอกข้อมูล JSON
    const { jsonData } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'jsonData',
        message: 'กรอกข้อมูล JSON:',
        default: '{}'
      }
    ]);
    
    try {
      Object.assign(dataValues, JSON.parse(jsonData));
    } catch (error) {
      console.log(chalk.red('❌ รูปแบบ JSON ไม่ถูกต้อง'));
      return;
    }
  }

  // บันทึกหรือแก้ไขข้อมูล
  try {
    if (existingData) {
      await dataEntryService.updateEntry(staffId, kpiId, year, quarter, { dataValues });
      console.log(chalk.green('✅ แก้ไขข้อมูลสำเร็จ'));
    } else {
      await dataEntryService.createEntry({
        staffId,
        kpiId,
        periodYear: year,
        periodQuarter: quarter,
        dataValues
      });
      console.log(chalk.green('✅ บันทึกข้อมูลสำเร็จ'));
    }

    // คำนวณและแสดงผลการประเมิน
    console.log(chalk.blue('\n🔄 กำลังคำนวณผลการประเมิน...'));
    const evaluation = await evaluationService.calculateKPIEvaluation({
      staffId,
      kpiId,
      periodYear: year,
      periodQuarter: quarter
    });
    
    console.log(chalk.green('\n📊 ผลการประเมิน:'));
    console.log(`   ผลคำนวณ: ${evaluation.calculatedValue}`);
    console.log(`   คะแนน: ${evaluation.score}/5`);
    console.log(`   เป้าหมาย: ${evaluation.targetValue || 'ไม่ระบุ'}`);
    
  } catch (error: any) {
    console.error(chalk.red(`❌ เกิดข้อผิดพลาดในการบันทึก: ${error.message}`));
  }
}

async function handleDataList(options: any) {
  console.log(chalk.bold.cyan('📋 รายการข้อมูล KPI'));
  console.log(chalk.cyan('═'.repeat(50)));

  const filters: {
    staffId?: number;
    kpiId?: number;
    periodYear?: number;
    periodQuarter?: number;
  } = {};
  
  if (options.staff) filters.staffId = parseInt(options.staff);
  if (options.kpi) filters.kpiId = parseInt(options.kpi);
  if (options.year) filters.periodYear = parseInt(options.year);
  if (options.quarter) filters.periodQuarter = parseInt(options.quarter);

  // ถ้าระบุแผนก ให้ดึงพนักงานในแผนกนั้น
  let staffIds: number[] | undefined;
  if (options.department) {
    const departmentStaff = await staffService.findByDepartment(parseInt(options.department));
    staffIds = departmentStaff.map(s => s.id);
    if (staffIds.length === 0) {
      console.log(chalk.red('❌ ไม่พบพนักงานในแผนกที่ระบุ'));
      return;
    }
  }

  try {
    let entries: any[] = [];
    
    if (staffIds && staffIds.length > 0) {
      // Get entries for specific staff members
      for (const staffId of staffIds) {
        const staffEntries = await dataEntryService.getStaffEntries(
          staffId,
          filters.periodYear,
          filters.periodQuarter
        );
        entries.push(...staffEntries);
      }
    } else if (filters.staffId) {
      entries = await dataEntryService.getStaffEntries(
        filters.staffId,
        filters.periodYear,
        filters.periodQuarter
      );
    } else if (filters.kpiId) {
      entries = await dataEntryService.getKPIEntries(
        filters.kpiId,
        filters.periodYear,
        filters.periodQuarter
      );
    } else if (filters.periodYear && filters.periodQuarter) {
      entries = await dataEntryService.getPeriodEntries(
        filters.periodYear,
        filters.periodQuarter
      );
    } else {
      console.log(chalk.yellow('⚠️  กรุณาระบุเงื่อนไขการค้นหา'));
      return;
    }
    
    if (entries.length === 0) {
      console.log(chalk.yellow('⚠️  ไม่พบข้อมูลตามเงื่อนไขที่ระบุ'));
      return;
    }

    console.log(chalk.green(`\n📊 พบข้อมูล ${entries.length} รายการ\n`));

    for (const entry of entries) {
      // ดึงข้อมูลพนักงานและ KPI
      const staff = await staffService.findById(entry.staffId);
      const kpi = await kpiService.findById(entry.kpiId);
      
      console.log(chalk.bold(`${staff?.name || 'Unknown'} - ${kpi?.name || 'Unknown'}`));
      console.log(`   📅 ช่วงเวลา: Q${entry.periodQuarter}/${entry.periodYear}`);
      console.log(`   👤 พนักงาน: ${staff?.email || 'N/A'}`);
      console.log(`   📊 KPI: ${kpi?.description || 'N/A'}`);
      console.log(`   📋 ข้อมูล: ${JSON.stringify(entry.dataValuesJson, null, 2)}`);
      console.log(`   🕐 บันทึกเมื่อ: ${entry.createdAt?.toLocaleString('th-TH') || 'N/A'}`);
      console.log('   ' + '─'.repeat(40));
    }
  } catch (error: any) {
    console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
  }
}