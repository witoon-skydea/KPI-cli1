import { Command } from 'commander';
import chalk from 'chalk';

export const dataCommand = new Command('data')
  .description('Manage raw data entries');

dataCommand
  .command('entry')
  .description('Enter raw data for KPI calculations')
  .action(async () => {
    console.log(chalk.yellow('🚧 Data entry features coming soon'));
  });

dataCommand
  .command('list')
  .description('List raw data entries')
  .action(async () => {
    console.log(chalk.yellow('🚧 Data entry features coming soon'));
  });