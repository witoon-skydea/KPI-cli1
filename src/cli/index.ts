#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { departmentCommand } from './commands/department.js';
import { staffCommand } from './commands/staff.js';
import { kpiCommand } from './commands/kpi.js';
import { dataCommand } from './commands/data.js';
import { reportCommand } from './commands/report.js';

const program = new Command();

program
  .name('kpi')
  .description('KPI Management CLI - Manage staff performance indicators')
  .version('1.0.0');

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
  console.log(chalk.yellow('Use --help to see available commands'));
  process.exitCode = 1;
});

if (process.argv.length === 2) {
  program.outputHelp();
} else {
  program.parse();
}