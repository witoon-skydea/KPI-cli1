import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { DepartmentService } from '../../core/services/DepartmentService.js';

const departmentService = new DepartmentService();

export const departmentCommand = new Command('department')
  .alias('dept')
  .description('Manage departments');

departmentCommand
  .command('create')
  .description('Create a new department')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Department name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
      ]);

      const department = await departmentService.create({
        name: answers.name.trim(),
        description: answers.description?.trim() || undefined,
      });

      console.log(chalk.green('✅ Department created successfully'));
      console.log(`ID: ${department.id}, Name: ${department.name}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to create department:'), error);
      process.exitCode = 1;
    }
  });

departmentCommand
  .command('list')
  .description('List all departments')
  .action(async () => {
    try {
      const departments = await departmentService.findAll();
      
      if (departments.length === 0) {
        console.log(chalk.yellow('No departments found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Name', 'Description', 'Created At'],
        style: { head: ['cyan'] },
      });

      departments.forEach(dept => {
        table.push([
          dept.id.toString(),
          dept.name,
          dept.description || '-',
          new Date(dept.createdAt).toLocaleDateString(),
        ]);
      });

      console.log(table.toString());
    } catch (error) {
      console.error(chalk.red('❌ Failed to list departments:'), error);
      process.exitCode = 1;
    }
  });

departmentCommand
  .command('update <id>')
  .description('Update a department')
  .action(async (id: string) => {
    try {
      const departmentId = parseInt(id, 10);
      if (isNaN(departmentId)) {
        console.error(chalk.red('❌ Invalid department ID'));
        return;
      }

      const existing = await departmentService.findById(departmentId);
      if (!existing) {
        console.error(chalk.red('❌ Department not found'));
        return;
      }

      console.log(chalk.blue(`Updating department: ${existing.name}`));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Department name:',
          default: existing.name,
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: existing.description || '',
        },
      ]);

      await departmentService.update(departmentId, {
        name: answers.name.trim(),
        description: answers.description?.trim() || undefined,
      });

      console.log(chalk.green('✅ Department updated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to update department:'), error);
      process.exitCode = 1;
    }
  });

departmentCommand
  .command('delete <id>')
  .description('Delete a department')
  .action(async (id: string) => {
    try {
      const departmentId = parseInt(id, 10);
      if (isNaN(departmentId)) {
        console.error(chalk.red('❌ Invalid department ID'));
        return;
      }

      const existing = await departmentService.findById(departmentId);
      if (!existing) {
        console.error(chalk.red('❌ Department not found'));
        return;
      }

      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to delete department "${existing.name}"?`,
          default: false,
        },
      ]);

      if (!confirm.confirmed) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      await departmentService.delete(departmentId);
      console.log(chalk.green('✅ Department deleted successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to delete department:'), error);
      process.exitCode = 1;
    }
  });