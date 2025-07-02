#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { departmentCommand } from './commands/department.js';
import { staffCommand } from './commands/staff.js';
import { kpiCommand } from './commands/kpi.js';
import { dataCommand } from './commands/data.js';
import { reportCommand } from './commands/report.js';
import { InteractiveCLI } from './interactive.js';

const program = new Command();

program
  .name('kpi')
  .description('KPI Management CLI - Manage staff performance indicators')
  .version('1.0.0');

// Add interactive mode command
program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(async () => {
    const cli = new InteractiveCLI();
    await cli.start();
  });

program
  .addCommand(departmentCommand)
  .addCommand(staffCommand)
  .addCommand(kpiCommand)
  .addCommand(dataCommand)
  .addCommand(reportCommand);

program.configureHelp({
  sortSubcommands: true,
});

program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.yellow('Use --help or "kpi interactive" for interactive mode'));
  process.exitCode = 1;
});

// If no arguments provided, start interactive mode by default
if (process.argv.length === 2) {
  console.log(chalk.bold.cyan('🎯 ระบบบริหารจัดการ KPI'));
  console.log(chalk.cyan('กำลังเริ่มโหมด Interactive...'));
  console.log(chalk.gray('หากต้องการใช้ command line ให้พิมพ์: kpi --help\n'));
  
  const cli = new InteractiveCLI();
  cli.start().catch(console.error);
} else {
  program.parse();
}