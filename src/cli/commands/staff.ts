import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { StaffService } from '../../core/services/StaffService.js';
import { DepartmentService } from '../../core/services/DepartmentService.js';

const staffService = new StaffService();
const departmentService = new DepartmentService();

export const staffCommand = new Command('staff')
  .description('Manage staff members');

staffCommand
  .command('create')
  .description('Create a new staff member')
  .action(async () => {
    try {
      const departments = await departmentService.findAll();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'employeeId',
          message: 'Employee ID:',
          validate: async (input: string) => {
            if (!input.trim()) return 'Employee ID is required';
            const existing = await staffService.findByEmployeeId(input.trim());
            if (existing) return 'Employee ID already exists';
            return true;
          },
        },
        {
          type: 'input',
          name: 'name',
          message: 'Full name:',
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'email',
          message: 'Email address:',
          validate: async (input: string) => {
            if (!input.trim()) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.trim())) return 'Invalid email format';
            const existing = await staffService.findByEmail(input.trim());
            if (existing) return 'Email already exists';
            return true;
          },
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Department:',
          choices: [
            { name: 'No department', value: null },
            ...departments.map(dept => ({ 
              name: dept.name, 
              value: dept.id 
            }))
          ],
        },
        {
          type: 'input',
          name: 'position',
          message: 'Position (optional):',
        },
        {
          type: 'input',
          name: 'hireDate',
          message: 'Hire date (YYYY-MM-DD, optional):',
          validate: (input: string) => {
            if (!input.trim()) return true;
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(input.trim())) return 'Date must be in YYYY-MM-DD format';
            const date = new Date(input.trim());
            if (isNaN(date.getTime())) return 'Invalid date';
            return true;
          },
        },
      ]);

      const newStaff = await staffService.create({
        employeeId: answers.employeeId.trim(),
        name: answers.name.trim(),
        email: answers.email.trim(),
        departmentId: answers.departmentId,
        position: answers.position?.trim() || undefined,
        hireDate: answers.hireDate?.trim() || undefined,
      });

      console.log(chalk.green('✅ Staff member created successfully'));
      console.log(`ID: ${newStaff.id}, Employee ID: ${newStaff.employeeId}, Name: ${newStaff.name}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to create staff member:'), error);
      process.exitCode = 1;
    }
  });

staffCommand
  .command('list')
  .description('List all staff members')
  .option('-a, --active-only', 'Show only active staff members')
  .option('-d, --department <id>', 'Filter by department ID')
  .action(async (options) => {
    try {
      let staffList;
      
      if (options.department) {
        const deptId = parseInt(options.department, 10);
        if (isNaN(deptId)) {
          console.error(chalk.red('❌ Invalid department ID'));
          return;
        }
        staffList = await staffService.findByDepartment(deptId);
      } else if (options.activeOnly) {
        staffList = await staffService.findActiveStaff();
      } else {
        staffList = await staffService.findAll();
      }
      
      if (staffList.length === 0) {
        console.log(chalk.yellow('No staff members found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Employee ID', 'Name', 'Email', 'Department', 'Position', 'Status', 'Hire Date'],
        style: { head: ['cyan'] },
        colWidths: [4, 12, 20, 25, 15, 15, 8, 12],
      });

      staffList.forEach(member => {
        table.push([
          member.id.toString(),
          member.employeeId,
          member.name,
          member.email,
          member.departmentName || '-',
          member.position || '-',
          member.active ? chalk.green('Active') : chalk.red('Inactive'),
          member.hireDate ? new Date(member.hireDate).toLocaleDateString() : '-',
        ]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`Total: ${staffList.length} staff member${staffList.length !== 1 ? 's' : ''}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to list staff members:'), error);
      process.exitCode = 1;
    }
  });

staffCommand
  .command('show <id>')
  .description('Show detailed information about a staff member')
  .action(async (id: string) => {
    try {
      const staffId = parseInt(id, 10);
      if (isNaN(staffId)) {
        console.error(chalk.red('❌ Invalid staff ID'));
        return;
      }

      const member = await staffService.findById(staffId);
      if (!member) {
        console.error(chalk.red('❌ Staff member not found'));
        return;
      }

      console.log(chalk.blue('\n📋 Staff Member Details\n'));
      console.log(`${chalk.bold('ID:')} ${member.id}`);
      console.log(`${chalk.bold('Employee ID:')} ${member.employeeId}`);
      console.log(`${chalk.bold('Name:')} ${member.name}`);
      console.log(`${chalk.bold('Email:')} ${member.email}`);
      console.log(`${chalk.bold('Department:')} ${member.departmentName || 'Not assigned'}`);
      console.log(`${chalk.bold('Position:')} ${member.position || 'Not specified'}`);
      console.log(`${chalk.bold('Status:')} ${member.active ? chalk.green('Active') : chalk.red('Inactive')}`);
      console.log(`${chalk.bold('Hire Date:')} ${member.hireDate ? new Date(member.hireDate).toLocaleDateString() : 'Not specified'}`);
      console.log(`${chalk.bold('Created:')} ${new Date(member.createdAt).toLocaleString()}`);
      console.log(`${chalk.bold('Updated:')} ${new Date(member.updatedAt).toLocaleString()}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to show staff member:'), error);
      process.exitCode = 1;
    }
  });

staffCommand
  .command('update <id>')
  .description('Update a staff member')
  .action(async (id: string) => {
    try {
      const staffId = parseInt(id, 10);
      if (isNaN(staffId)) {
        console.error(chalk.red('❌ Invalid staff ID'));
        return;
      }

      const existing = await staffService.findById(staffId);
      if (!existing) {
        console.error(chalk.red('❌ Staff member not found'));
        return;
      }

      console.log(chalk.blue(`Updating staff member: ${existing.name}`));
      
      const departments = await departmentService.findAll();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'employeeId',
          message: 'Employee ID:',
          default: existing.employeeId,
          validate: async (input: string) => {
            if (!input.trim()) return 'Employee ID is required';
            if (input.trim() === existing.employeeId) return true;
            const duplicate = await staffService.findByEmployeeId(input.trim());
            if (duplicate) return 'Employee ID already exists';
            return true;
          },
        },
        {
          type: 'input',
          name: 'name',
          message: 'Full name:',
          default: existing.name,
          validate: (input: string) => input.trim().length > 0 || 'Name is required',
        },
        {
          type: 'input',
          name: 'email',
          message: 'Email address:',
          default: existing.email,
          validate: async (input: string) => {
            if (!input.trim()) return 'Email is required';
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(input.trim())) return 'Invalid email format';
            if (input.trim() === existing.email) return true;
            const duplicate = await staffService.findByEmail(input.trim());
            if (duplicate) return 'Email already exists';
            return true;
          },
        },
        {
          type: 'list',
          name: 'departmentId',
          message: 'Department:',
          default: existing.departmentId,
          choices: [
            { name: 'No department', value: null },
            ...departments.map(dept => ({ 
              name: dept.name, 
              value: dept.id 
            }))
          ],
        },
        {
          type: 'input',
          name: 'position',
          message: 'Position:',
          default: existing.position || '',
        },
        {
          type: 'input',
          name: 'hireDate',
          message: 'Hire date (YYYY-MM-DD):',
          default: existing.hireDate || '',
          validate: (input: string) => {
            if (!input.trim()) return true;
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(input.trim())) return 'Date must be in YYYY-MM-DD format';
            const date = new Date(input.trim());
            if (isNaN(date.getTime())) return 'Invalid date';
            return true;
          },
        },
        {
          type: 'confirm',
          name: 'active',
          message: 'Is staff member active?',
          default: existing.active,
        },
      ]);

      await staffService.update(staffId, {
        employeeId: answers.employeeId.trim(),
        name: answers.name.trim(),
        email: answers.email.trim(),
        departmentId: answers.departmentId,
        position: answers.position?.trim() || undefined,
        hireDate: answers.hireDate?.trim() || undefined,
        active: answers.active,
      });

      console.log(chalk.green('✅ Staff member updated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to update staff member:'), error);
      process.exitCode = 1;
    }
  });

staffCommand
  .command('deactivate <id>')
  .description('Deactivate a staff member')
  .action(async (id: string) => {
    try {
      const staffId = parseInt(id, 10);
      if (isNaN(staffId)) {
        console.error(chalk.red('❌ Invalid staff ID'));
        return;
      }

      const existing = await staffService.findById(staffId);
      if (!existing) {
        console.error(chalk.red('❌ Staff member not found'));
        return;
      }

      if (!existing.active) {
        console.log(chalk.yellow('⚠️  Staff member is already inactive'));
        return;
      }

      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to deactivate "${existing.name}"?`,
          default: false,
        },
      ]);

      if (!confirm.confirmed) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      await staffService.setActive(staffId, false);
      console.log(chalk.green('✅ Staff member deactivated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to deactivate staff member:'), error);
      process.exitCode = 1;
    }
  });

staffCommand
  .command('activate <id>')
  .description('Activate a staff member')
  .action(async (id: string) => {
    try {
      const staffId = parseInt(id, 10);
      if (isNaN(staffId)) {
        console.error(chalk.red('❌ Invalid staff ID'));
        return;
      }

      const existing = await staffService.findById(staffId);
      if (!existing) {
        console.error(chalk.red('❌ Staff member not found'));
        return;
      }

      if (existing.active) {
        console.log(chalk.yellow('⚠️  Staff member is already active'));
        return;
      }

      await staffService.setActive(staffId, true);
      console.log(chalk.green('✅ Staff member activated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to activate staff member:'), error);
      process.exitCode = 1;
    }
  });

staffCommand
  .command('delete <id>')
  .description('Delete a staff member (permanent)')
  .action(async (id: string) => {
    try {
      const staffId = parseInt(id, 10);
      if (isNaN(staffId)) {
        console.error(chalk.red('❌ Invalid staff ID'));
        return;
      }

      const existing = await staffService.findById(staffId);
      if (!existing) {
        console.error(chalk.red('❌ Staff member not found'));
        return;
      }

      console.log(chalk.red('⚠️  WARNING: This will permanently delete the staff member and all related data!'));
      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to permanently delete "${existing.name}"?`,
          default: false,
        },
      ]);

      if (!confirm.confirmed) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      await staffService.delete(staffId);
      console.log(chalk.green('✅ Staff member deleted successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to delete staff member:'), error);
      process.exitCode = 1;
    }
  });