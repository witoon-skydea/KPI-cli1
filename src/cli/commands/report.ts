import { Command } from 'commander';
import chalk from 'chalk';

export const reportCommand = new Command('report')
  .description('Generate reports');

reportCommand
  .command('quarterly')
  .description('Generate quarterly reports')
  .action(async () => {
    console.log(chalk.yellow('🚧 Quarterly reporting features coming soon'));
  });

reportCommand
  .command('annual')
  .description('Generate annual reports')
  .action(async () => {
    console.log(chalk.yellow('🚧 Annual reporting features coming soon'));
  });