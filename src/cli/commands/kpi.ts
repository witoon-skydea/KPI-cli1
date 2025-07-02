import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import Table from 'cli-table3';
import { KPIService } from '../../core/services/KPIService.js';
import { FormulaEngine } from '../../core/utils/FormulaEngine.js';
import { ScoringEngine } from '../../core/utils/ScoringEngine.js';
import type { KPIFormula, ScoringCriteria, RawDataSchema } from '../../types/index.js';

const kpiService = new KPIService();

export const kpiCommand = new Command('kpi')
  .description('Manage KPIs');

kpiCommand
  .command('create')
  .description('Create a new KPI')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Creating a new KPI\n'));
      
      const basicInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'KPI name:',
          validate: async (input: string) => {
            if (!input.trim()) return 'KPI name is required';
            const existing = await kpiService.findByName(input.trim());
            if (existing) return 'KPI name already exists';
            return true;
          },
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description (optional):',
        },
        {
          type: 'number',
          name: 'weight',
          message: 'Weight (default: 1.0):',
          default: 1.0,
          validate: (input: number) => input > 0 || 'Weight must be positive',
        },
        {
          type: 'confirm',
          name: 'hasFormula',
          message: 'Does this KPI have a calculation formula?',
          default: false,
        },
      ]);

      let formula: KPIFormula | undefined;
      let rawDataSchema: RawDataSchema | undefined;
      let targetValue: number | undefined;

      if (basicInfo.hasFormula) {
        const formulaInfo = await promptForFormula();
        formula = formulaInfo.formula;
        rawDataSchema = formulaInfo.rawDataSchema;
        
        const targetPrompt = await inquirer.prompt([
          {
            type: 'number',
            name: 'targetValue',
            message: 'Target value (optional):',
          },
        ]);
        targetValue = targetPrompt.targetValue;
      }

      const scoringPrompt = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'hasScoringCriteria',
          message: 'Define scoring criteria (1-5 points)?',
          default: true,
        },
      ]);

      let scoringCriteria: ScoringCriteria | undefined;
      if (scoringPrompt.hasScoringCriteria) {
        scoringCriteria = await promptForScoringCriteria();
      }

      const createData: Record<string, unknown> = {
        name: basicInfo.name.trim(),
        description: basicInfo.description?.trim() || undefined,
        weight: basicInfo.weight,
      };

      if (formula) createData.formula = formula;
      if (rawDataSchema) createData.rawDataSchema = rawDataSchema;
      if (targetValue !== undefined) createData.targetValue = targetValue;
      if (scoringCriteria) createData.scoringCriteria = scoringCriteria;

      const newKPI = await kpiService.create(createData as any);

      console.log(chalk.green('\n✅ KPI created successfully'));
      console.log(`ID: ${newKPI.id}, Name: ${newKPI.name}, Weight: ${newKPI.weight}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to create KPI:'), error);
      process.exitCode = 1;
    }
  });

kpiCommand
  .command('list')
  .description('List all KPIs')
  .option('-a, --active-only', 'Show only active KPIs')
  .action(async (options) => {
    try {
      const kpiList = options.activeOnly 
        ? await kpiService.findActive()
        : await kpiService.findAll();
      
      if (kpiList.length === 0) {
        console.log(chalk.yellow('No KPIs found'));
        return;
      }

      const table = new Table({
        head: ['ID', 'Name', 'Description', 'Weight', 'Target', 'Formula', 'Status'],
        style: { head: ['cyan'] },
        colWidths: [4, 25, 30, 8, 10, 10, 8],
      });

      kpiList.forEach(kpi => {
        table.push([
          kpi.id.toString(),
          kpi.name,
          kpi.description || '-',
          kpi.weight.toString(),
          kpi.targetValue?.toString() || '-',
          kpi.formulaJson ? '✓' : '-',
          kpi.active ? chalk.green('Active') : chalk.red('Inactive'),
        ]);
      });

      console.log(table.toString());
      console.log(chalk.gray(`Total: ${kpiList.length} KPI${kpiList.length !== 1 ? 's' : ''}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to list KPIs:'), error);
      process.exitCode = 1;
    }
  });

kpiCommand
  .command('show <id>')
  .description('Show detailed information about a KPI')
  .action(async (id: string) => {
    try {
      const kpiId = parseInt(id, 10);
      if (isNaN(kpiId)) {
        console.error(chalk.red('❌ Invalid KPI ID'));
        return;
      }

      const kpi = await kpiService.findById(kpiId);
      if (!kpi) {
        console.error(chalk.red('❌ KPI not found'));
        return;
      }

      console.log(chalk.blue('\n📊 KPI Details\n'));
      console.log(`${chalk.bold('ID:')} ${kpi.id}`);
      console.log(`${chalk.bold('Name:')} ${kpi.name}`);
      console.log(`${chalk.bold('Description:')} ${kpi.description || 'Not provided'}`);
      console.log(`${chalk.bold('Weight:')} ${kpi.weight}`);
      console.log(`${chalk.bold('Target Value:')} ${kpi.targetValue || 'Not set'}`);
      console.log(`${chalk.bold('Status:')} ${kpi.active ? chalk.green('Active') : chalk.red('Inactive')}`);
      
      if (kpi.formulaJson) {
        console.log(chalk.blue('\n📐 Formula:'));
        console.log(`  Type: ${kpi.formulaJson.type}`);
        console.log(`  Expression: ${kpi.formulaJson.expression}`);
        console.log(`  Variables: ${kpi.formulaJson.variables.join(', ')}`);
      }

      if (kpi.rawDataSchemaJson) {
        console.log(chalk.blue('\n📋 Raw Data Schema:'));
        kpi.rawDataSchemaJson.fields.forEach((field, index) => {
          console.log(`  ${index + 1}. ${field.name} (${field.type}${field.required ? ', required' : ', optional'})`);
          if (field.description) console.log(`     ${field.description}`);
        });
      }

      if (kpi.scoringCriteriaJson) {
        console.log(chalk.blue('\n🎯 Scoring Criteria:'));
        kpi.scoringCriteriaJson.ranges.forEach((range) => {
          console.log(`  ${range.score} points: ${range.min} - ${range.max}`);
        });
      }

      console.log(`\n${chalk.bold('Created:')} ${new Date(kpi.createdAt).toLocaleString()}`);
      console.log(`${chalk.bold('Updated:')} ${new Date(kpi.updatedAt).toLocaleString()}`);
    } catch (error) {
      console.error(chalk.red('❌ Failed to show KPI:'), error);
      process.exitCode = 1;
    }
  });

kpiCommand
  .command('test-formula <id>')
  .description('Test a KPI formula with sample data')
  .action(async (id: string) => {
    try {
      const kpiId = parseInt(id, 10);
      if (isNaN(kpiId)) {
        console.error(chalk.red('❌ Invalid KPI ID'));
        return;
      }

      const kpi = await kpiService.findById(kpiId);
      if (!kpi) {
        console.error(chalk.red('❌ KPI not found'));
        return;
      }

      if (!kpi.formulaJson) {
        console.error(chalk.red('❌ KPI has no formula to test'));
        return;
      }

      console.log(chalk.blue(`\n🧪 Testing formula for KPI: ${kpi.name}\n`));
      console.log(`Formula: ${kpi.formulaJson.expression}`);
      console.log(`Variables: ${kpi.formulaJson.variables.join(', ')}\n`);

      const context: Record<string, number> = {};
      for (const variable of kpi.formulaJson.variables) {
        const answer = await inquirer.prompt([
          {
            type: 'number',
            name: 'value',
            message: `Enter value for ${variable}:`,
            validate: (input: number) => !isNaN(input) || 'Must be a valid number',
          },
        ]);
        context[variable] = answer.value;
      }

      const result = FormulaEngine.calculate(kpi.formulaJson, context);
      console.log(chalk.green(`\n✅ Formula result: ${result}`));

      if (kpi.scoringCriteriaJson) {
        const score = ScoringEngine.calculateScore(result, kpi.scoringCriteriaJson);
        console.log(chalk.blue(`🎯 Score: ${score}/5 (${ScoringEngine.getScoreDescription(score)})`));
      }

      if (kpi.targetValue) {
        const percentage = (result / kpi.targetValue) * 100;
        console.log(chalk.cyan(`📊 Target achievement: ${percentage.toFixed(1)}% (${result}/${kpi.targetValue})`));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to test formula:'), error);
      process.exitCode = 1;
    }
  });

kpiCommand
  .command('update <id>')
  .description('Update a KPI')
  .action(async (id: string) => {
    try {
      const kpiId = parseInt(id, 10);
      if (isNaN(kpiId)) {
        console.error(chalk.red('❌ Invalid KPI ID'));
        return;
      }

      const existing = await kpiService.findById(kpiId);
      if (!existing) {
        console.error(chalk.red('❌ KPI not found'));
        return;
      }

      console.log(chalk.blue(`Updating KPI: ${existing.name}\n`));
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'KPI name:',
          default: existing.name,
          validate: async (input: string) => {
            if (!input.trim()) return 'KPI name is required';
            if (input.trim() === existing.name) return true;
            const duplicate = await kpiService.findByName(input.trim());
            if (duplicate) return 'KPI name already exists';
            return true;
          },
        },
        {
          type: 'input',
          name: 'description',
          message: 'Description:',
          default: existing.description || '',
        },
        {
          type: 'number',
          name: 'weight',
          message: 'Weight:',
          default: existing.weight,
          validate: (input: number) => input > 0 || 'Weight must be positive',
        },
        {
          type: 'number',
          name: 'targetValue',
          message: 'Target value (leave empty to remove):',
          default: existing.targetValue || undefined,
        },
        {
          type: 'confirm',
          name: 'active',
          message: 'Is KPI active?',
          default: existing.active,
        },
      ]);

      await kpiService.update(kpiId, {
        name: answers.name.trim(),
        description: answers.description?.trim() || undefined,
        weight: answers.weight,
        targetValue: answers.targetValue,
        active: answers.active,
      });

      console.log(chalk.green('✅ KPI updated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to update KPI:'), error);
      process.exitCode = 1;
    }
  });

kpiCommand
  .command('deactivate <id>')
  .description('Deactivate a KPI')
  .action(async (id: string) => {
    try {
      const kpiId = parseInt(id, 10);
      if (isNaN(kpiId)) {
        console.error(chalk.red('❌ Invalid KPI ID'));
        return;
      }

      const existing = await kpiService.findById(kpiId);
      if (!existing) {
        console.error(chalk.red('❌ KPI not found'));
        return;
      }

      if (!existing.active) {
        console.log(chalk.yellow('⚠️  KPI is already inactive'));
        return;
      }

      const confirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmed',
          message: `Are you sure you want to deactivate KPI "${existing.name}"?`,
          default: false,
        },
      ]);

      if (!confirm.confirmed) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      await kpiService.setActive(kpiId, false);
      console.log(chalk.green('✅ KPI deactivated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to deactivate KPI:'), error);
      process.exitCode = 1;
    }
  });

kpiCommand
  .command('activate <id>')
  .description('Activate a KPI')
  .action(async (id: string) => {
    try {
      const kpiId = parseInt(id, 10);
      if (isNaN(kpiId)) {
        console.error(chalk.red('❌ Invalid KPI ID'));
        return;
      }

      const existing = await kpiService.findById(kpiId);
      if (!existing) {
        console.error(chalk.red('❌ KPI not found'));
        return;
      }

      if (existing.active) {
        console.log(chalk.yellow('⚠️  KPI is already active'));
        return;
      }

      await kpiService.setActive(kpiId, true);
      console.log(chalk.green('✅ KPI activated successfully'));
    } catch (error) {
      console.error(chalk.red('❌ Failed to activate KPI:'), error);
      process.exitCode = 1;
    }
  });

async function promptForFormula(): Promise<{ formula: KPIFormula; rawDataSchema: RawDataSchema }> {
  const formulaType = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Formula type:',
      choices: [
        { name: 'Arithmetic (e.g., sales + commission * 0.1)', value: 'arithmetic' },
        { name: 'Function (e.g., sum(sales, commission))', value: 'function' },
      ],
    },
  ]);

  const expression = await inquirer.prompt([
    {
      type: 'input',
      name: 'expression',
      message: 'Formula expression:',
      validate: (input: string) => input.trim().length > 0 || 'Expression is required',
    },
  ]);

  const variables = FormulaEngine.extractVariables(expression.expression);
  
  if (variables.length === 0) {
    throw new Error('Formula must contain at least one variable');
  }

  console.log(chalk.blue(`\nDetected variables: ${variables.join(', ')}`));
  console.log(chalk.yellow('Define the raw data schema for these variables:\n'));

  const fields = [];
  for (const variable of variables) {
    const fieldInfo = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: `Type for variable "${variable}":`,
        choices: ['number', 'string', 'date'],
        default: 'number',
      },
      {
        type: 'confirm',
        name: 'required',
        message: `Is "${variable}" required?`,
        default: true,
      },
      {
        type: 'input',
        name: 'description',
        message: `Description for "${variable}" (optional):`,
      },
    ]);

    fields.push({
      name: variable,
      type: fieldInfo.type,
      required: fieldInfo.required,
      description: fieldInfo.description?.trim() || undefined,
    });
  }

  const formula: KPIFormula = {
    type: formulaType.type,
    expression: expression.expression.trim(),
    variables,
  };

  const rawDataSchema: RawDataSchema = { fields };

  if (!FormulaEngine.validateExpression(formula.expression, formula.variables)) {
    throw new Error('Invalid formula expression');
  }

  return { formula, rawDataSchema };
}

async function promptForScoringCriteria(): Promise<ScoringCriteria> {
  const criteriaType = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'Scoring criteria type:',
      choices: [
        { name: 'Custom ranges', value: 'custom' },
        { name: 'Linear scaling (min-max)', value: 'linear' },
        { name: 'Percentage (0-100%)', value: 'percentage' },
        { name: 'Inverse scaling (lower is better)', value: 'inverse' },
      ],
    },
  ]);

  switch (criteriaType.type) {
    case 'linear': {
      const values = await inquirer.prompt([
        {
          type: 'number',
          name: 'minValue',
          message: 'Minimum value (1 point):',
          validate: (input: number) => !isNaN(input) || 'Must be a number',
        },
        {
          type: 'number',
          name: 'maxValue',
          message: 'Maximum value (5 points):',
          validate: (input: number) => !isNaN(input) || 'Must be a number',
        },
      ]);
      return ScoringEngine.createLinearScoringCriteria(values.minValue, values.maxValue);
    }
    
    case 'percentage':
      return ScoringEngine.createPercentageScoringCriteria();
    
    case 'inverse': {
      const values = await inquirer.prompt([
        {
          type: 'number',
          name: 'minValue',
          message: 'Minimum value (5 points):',
          validate: (input: number) => !isNaN(input) || 'Must be a number',
        },
        {
          type: 'number',
          name: 'maxValue',
          message: 'Maximum value (1 point):',
          validate: (input: number) => !isNaN(input) || 'Must be a number',
        },
      ]);
      return ScoringEngine.createInverseScoringCriteria(values.minValue, values.maxValue);
    }
    
    default: {
      const ranges = [];
      
      for (let score = 1; score <= 5; score++) {
        console.log(chalk.blue(`\nDefining range for ${score} point${score !== 1 ? 's' : ''}:`));
        const range = await inquirer.prompt([
          {
            type: 'number',
            name: 'min',
            message: `Minimum value for ${score} point${score !== 1 ? 's' : ''}:`,
            validate: (input: number) => !isNaN(input) || 'Must be a number',
          },
          {
            type: 'number',
            name: 'max',
            message: `Maximum value for ${score} point${score !== 1 ? 's' : ''}:`,
            validate: (input: number) => !isNaN(input) || 'Must be a number',
          },
        ]);
        
        ranges.push({ min: range.min, max: range.max, score });
      }
      
      return { ranges };
    }
  }
}