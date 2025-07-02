import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ReportService } from '../../core/services/ReportService.js';
import { closeDatabase } from '../../database/connection.js';

const reportService = new ReportService();

export const reportCommand = new Command('report')
  .description('Generate reports');

reportCommand
  .command('quarterly')
  .description('Generate quarterly reports')
  .option('-d, --department <id>', 'Department ID')
  .option('-y, --year <year>', 'Year (default: current year)')
  .option('-q, --quarter <quarter>', 'Quarter (1-4)')
  .action(async (options) => {
    try {
      let departmentId = options.department;
      const year = options.year || new Date().getFullYear();
      let quarter = options.quarter;

      // ถ้าไม่ระบุแผนก ให้เลือก
      if (!departmentId) {
        const departments = await reportService.getAllDepartments();
        if (departments.length === 0) {
          console.log(chalk.red('❌ ไม่พบแผนกในระบบ'));
          return;
        }

        const { selectedDepartment } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedDepartment',
            message: 'เลือกแผนกที่ต้องการดูรายงาน:',
            choices: departments.map(dept => ({
              name: `${dept.name} (ID: ${dept.id})`,
              value: dept.id
            }))
          }
        ]);
        departmentId = selectedDepartment;
      }

      // ถ้าไม่ระบุไตรมาส ให้เลือก
      if (!quarter) {
        const { selectedQuarter } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedQuarter',
            message: 'เลือกไตรมาส:',
            choices: [
              { name: 'ไตรมาสที่ 1 (มกราคม-มีนาคม)', value: 1 },
              { name: 'ไตรมาสที่ 2 (เมษายน-มิถุนายน)', value: 2 },
              { name: 'ไตรมาสที่ 3 (กรกฎาคม-กันยายน)', value: 3 },
              { name: 'ไตรมาสที่ 4 (ตุลาคม-ธันวาคม)', value: 4 }
            ]
          }
        ]);
        quarter = selectedQuarter;
      }

      console.log(chalk.blue('\n🔄 กำลังสร้างรายงานไตรมาส...\n'));

      const report = await reportService.generateQuarterlyReport(
        parseInt(departmentId),
        parseInt(year),
        parseInt(quarter)
      );

      displayQuarterlyReport(report);

    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    } finally {
      closeDatabase();
    }
  });

reportCommand
  .command('annual')
  .description('Generate annual reports')
  .option('-d, --department <id>', 'Department ID')
  .option('-y, --year <year>', 'Year (default: current year)')
  .action(async (options) => {
    try {
      await handleAnnualReport(options);
    } catch (error: any) {
      console.error(chalk.red(`❌ เกิดข้อผิดพลาด: ${error.message}`));
    } finally {
      closeDatabase();
    }
  });

function displayQuarterlyReport(report: any) {
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
  console.log(`📊 คะแนนเฉลี่ย: ${reportService.formatPercentage(departmentSummary.averageScore)}`);
  
  console.log('\n🏆 การกระจายของเกรด:');
  Object.entries(departmentSummary.gradeDistribution).forEach(([grade, count]) => {
    const color = reportService.getGradeColor(grade);
    console.log(`  ${chalk[color](`เกรด ${grade}`)}: ${count} คน`);
  });

  if (departmentSummary.topPerformers.length > 0) {
    console.log('\n🌟 ผู้มีผลงานดีเด่น:');
    departmentSummary.topPerformers.forEach((staff: any, index: number) => {
      console.log(`  ${index + 1}. ${staff.name} (${staff.position})`);
    });
  }

  // KPI Performance
  console.log(chalk.bold.yellow('\n📋 ผลการดำเนินงานแต่ละ KPI'));
  console.log('─'.repeat(50));
  departmentSummary.kpiPerformance.forEach((kpiPerf: any, index: number) => {
    console.log(`${index + 1}. ${chalk.bold(kpiPerf.kpi.name)}`);
    console.log(`   📊 คะแนนเฉลี่ย: ${reportService.formatScore(kpiPerf.averageScore)}`);
    console.log(`   🎯 ความสำเร็จของเป้าหมาย: ${reportService.formatPercentage(kpiPerf.targetAchievement)}`);
    console.log(`   👥 จำนวนผู้ประเมิน: ${kpiPerf.staffCount} คน`);
    console.log('');
  });

  // Individual Staff Reports
  console.log(chalk.bold.green('\n👤 รายงานรายบุคคล'));
  console.log('═'.repeat(80));

  staffReports.forEach((staffReport: any, index: number) => {
    const { staff, evaluations, summary } = staffReport;
    
    console.log(`\n${index + 1}. ${chalk.bold(staff.name)} (${staff.position})`);
    console.log(`   📧 ${staff.email}`);
    console.log(`   🏆 คะแนนรวม: ${reportService.formatPercentage(summary.percentageScore)} (เกรด ${chalk[reportService.getGradeColor(summary.grade)](summary.grade)})`);
    
    console.log('   📊 รายละเอียด KPI:');
    evaluations.forEach((evaluation: any) => {
      const achievementPercent = evaluation.targetValue > 0 
        ? ((evaluation.calculatedValue / evaluation.targetValue) * 100).toFixed(1)
        : 'N/A';
      
      console.log(`      • ${evaluation.kpi.name}`);
      console.log(`        ผลคะแนน: ${reportService.formatScore(evaluation.score)} | เป้าหมาย: ${evaluation.targetValue || 'N/A'} | ผลจริง: ${evaluation.calculatedValue}`);
      if (achievementPercent !== 'N/A') {
        console.log(`        ความสำเร็จ: ${achievementPercent}%`);
      }
    });
    
    if (index < staffReports.length - 1) {
      console.log('   ' + '─'.repeat(50));
    }
  });

  console.log(chalk.bold.cyan('\n═'.repeat(80)));
  console.log(chalk.bold.cyan(`📅 รายงานสร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`));
  console.log(chalk.bold.cyan('═'.repeat(80)));
}

async function handleAnnualReport(options: any) {
  let departmentId = options.department;
  let year = options.year || new Date().getFullYear();

  // ถ้าไม่ระบุแผนก ให้เลือก
  if (!departmentId) {
    const departments = await reportService.getAllDepartments();
    if (departments.length === 0) {
      console.log(chalk.red('❌ ไม่พบแผนกในระบบ'));
      return;
    }

    const { selectedDepartment } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedDepartment',
        message: 'เลือกแผนกที่ต้องการดูรายงาน:',
        choices: departments.map(dept => ({
          name: `${dept.name} (ID: ${dept.id})`,
          value: dept.id
        }))
      }
    ]);
    departmentId = selectedDepartment;
  }

  console.log(chalk.blue('\n🔄 กำลังสร้างรายงานประจำปี...\n'));

  const report = await reportService.generateAnnualReport(
    parseInt(departmentId),
    parseInt(year)
  );

  displayAnnualReport(report);
}

function displayAnnualReport(report: any) {
  const { period, department, quarterlyTrends, annualSummary, staffAnnualReports } = report;

  // Header
  console.log(chalk.bold.magenta('═'.repeat(80)));
  console.log(chalk.bold.magenta(`📊 รายงานสรุปผลการดำเนินงาน ${period.displayName}`));
  console.log(chalk.bold.magenta(`🏢 แผนก: ${department.name}`));
  console.log(chalk.bold.magenta('═'.repeat(80)));

  // Annual Summary
  console.log(chalk.bold.yellow('\n📈 สรุปผลรวมของปี'));
  console.log('─'.repeat(50));
  console.log(`👥 จำนวนพนักงานรวม: ${annualSummary.totalStaff} คน`);
  console.log(`📊 คะแนนเฉลี่ยรายปี: ${reportService.formatPercentage(annualSummary.yearlyAverageScore)}`);
  console.log(`🏆 ไตรมาสที่ดีที่สุด: Q${annualSummary.bestQuarter}`);
  console.log(`📉 ไตรมาสที่ต้องปรับปรุง: Q${annualSummary.worstQuarter}`);
  
  const trendColor = reportService.getTrendColor(annualSummary.improvementTrend);
  const trendIcon = reportService.getTrendIcon(annualSummary.improvementTrend);
  console.log(`${trendIcon} แนวโน้มการปรับปรุง: ${chalk[trendColor](getThaiTrend(annualSummary.improvementTrend))}`);
  
  console.log('\n🏆 การกระจายของเกรดรายปี:');
  Object.entries(annualSummary.gradeDistribution).forEach(([grade, count]) => {
    const color = reportService.getGradeColor(grade);
    console.log(`  ${chalk[color](`เกรด ${grade}`)}: ${count} คน`);
  });

  if (annualSummary.topPerformers.length > 0) {
    console.log('\n🌟 ผู้มีผลงานดีเด่นประจำปี:');
    annualSummary.topPerformers.forEach((staff: any, index: number) => {
      console.log(`  ${index + 1}. ${staff.name} (${staff.position})`);
    });
  }

  // Quarterly Trends
  console.log(chalk.bold.cyan('\n📊 แนวโน้มรายไตรมาส'));
  console.log('─'.repeat(50));
  quarterlyTrends.forEach((trend: any) => {
    const quarterName = `ไตรมาสที่ ${trend.quarter}`;
    const scoreDisplay = trend.averageScore > 0 
      ? reportService.formatPercentage(trend.averageScore)
      : 'ไม่มีข้อมูล';
    
    console.log(`📅 ${quarterName}:`);
    console.log(`   📊 คะแนนเฉลี่ย: ${scoreDisplay}`);
    console.log(`   👥 จำนวนพนักงาน: ${trend.staffCount} คน`);
    if (trend.topPerformer) {
      console.log(`   🏆 ผู้มีผลงานดีเด่น: ${trend.topPerformer.name}`);
    }
    console.log('');
  });

  // Individual Staff Annual Reports
  console.log(chalk.bold.green('\n👤 รายงานรายบุคคลประจำปี'));
  console.log('═'.repeat(80));

  staffAnnualReports.forEach((staffReport: any, index: number) => {
    const { staff, quarterlyScores, annualAverage, annualGrade, trend, bestQuarter, worstQuarter } = staffReport;
    
    console.log(`\n${index + 1}. ${chalk.bold(staff.name)} (${staff.position})`);
    console.log(`   📧 ${staff.email}`);
    console.log(`   🏆 คะแนนเฉลี่ยรายปี: ${reportService.formatPercentage(annualAverage)} (เกรด ${chalk[reportService.getGradeColor(annualGrade)](annualGrade)})`);
    
    const staffTrendColor = reportService.getTrendColor(trend);
    const staffTrendIcon = reportService.getTrendIcon(trend);
    console.log(`   ${staffTrendIcon} แนวโน้ม: ${chalk[staffTrendColor](getThaiTrend(trend))}`);
    console.log(`   🏆 ไตรมาสที่ดีที่สุด: Q${bestQuarter}`);
    console.log(`   📉 ไตรมาสที่ต้องปรับปรุง: Q${worstQuarter}`);
    
    console.log('   📊 คะแนนรายไตรมาส:');
    for (let q = 1; q <= 4; q++) {
      const score = quarterlyScores[q];
      if (score > 0) {
        console.log(`      Q${q}: ${reportService.formatPercentage(score)}`);
      } else {
        console.log(`      Q${q}: ${chalk.gray('ไม่มีข้อมูล')}`);
      }
    }
    
    if (index < staffAnnualReports.length - 1) {
      console.log('   ' + '─'.repeat(50));
    }
  });

  console.log(chalk.bold.magenta('\n═'.repeat(80)));
  console.log(chalk.bold.magenta(`📅 รายงานสร้างเมื่อ: ${new Date().toLocaleString('th-TH')}`));
  console.log(chalk.bold.magenta('═'.repeat(80)));
}

function getThaiTrend(trend: string): string {
  switch (trend) {
    case 'improving': return 'กำลังปรับปรุง';
    case 'declining': return 'กำลังลดลง';
    default: return 'คงที่';
  }
}