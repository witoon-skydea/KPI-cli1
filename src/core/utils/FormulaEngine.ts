import type { KPIFormula } from '../../types/index.js';

export interface FormulaContext {
  [variable: string]: number;
}

export class FormulaEngine {
  static calculate(formula: KPIFormula, context: FormulaContext): number {
    this.validateContext(formula, context);

    switch (formula.type) {
      case 'arithmetic':
        return this.calculateArithmetic(formula.expression, context);
      case 'function':
        return this.calculateFunction(formula.expression, context);
      default:
        throw new Error(`Unsupported formula type: ${formula.type}`);
    }
  }

  private static validateContext(formula: KPIFormula, context: FormulaContext): void {
    for (const variable of formula.variables) {
      if (!(variable in context)) {
        throw new Error(`Missing variable "${variable}" in context`);
      }
      if (typeof context[variable] !== 'number' || isNaN(context[variable])) {
        throw new Error(`Variable "${variable}" must be a valid number`);
      }
    }
  }

  private static calculateArithmetic(expression: string, context: FormulaContext): number {
    let processedExpression = expression;
    
    for (const [variable, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${variable}\\b`, 'g');
      processedExpression = processedExpression.replace(regex, value.toString());
    }

    try {
      const result = this.evaluateExpression(processedExpression);
      
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Formula evaluation did not produce a valid number');
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to evaluate arithmetic expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static calculateFunction(expression: string, context: FormulaContext): number {
    const functionMatch = expression.match(/^(\w+)\((.*)\)$/);
    if (!functionMatch || functionMatch.length < 3) {
      throw new Error('Invalid function format. Expected: functionName(arguments)');
    }

    const functionName = functionMatch[1];
    const argsString = functionMatch[2];
    if (!functionName) {
      throw new Error('Invalid function name');
    }
    const args = this.parseArguments(argsString || '', context);

    switch (functionName.toLowerCase()) {
      case 'sum':
        return args.reduce((sum, val) => sum + val, 0);
      case 'average':
      case 'avg':
        if (args.length === 0) throw new Error('Average function requires at least one argument');
        return args.reduce((sum, val) => sum + val, 0) / args.length;
      case 'min':
        if (args.length === 0) throw new Error('Min function requires at least one argument');
        return Math.min(...args);
      case 'max':
        if (args.length === 0) throw new Error('Max function requires at least one argument');
        return Math.max(...args);
      case 'count':
        return args.length;
      case 'percentage': {
        if (args.length !== 2) throw new Error('Percentage function requires exactly two arguments: percentage(value, total)');
        const total = args[1];
        const value = args[0];
        if (typeof total !== 'number' || typeof value !== 'number') {
          throw new Error('Percentage function arguments must be numbers');
        }
        if (total === 0) throw new Error('Cannot calculate percentage with zero total');
        return (value / total) * 100;
      }
      default:
        throw new Error(`Unsupported function: ${functionName}`);
    }
  }

  private static parseArguments(argsString: string, context: FormulaContext): number[] {
    if (!argsString.trim()) return [];
    
    const args = argsString.split(',').map(arg => arg.trim());
    const values: number[] = [];

    for (const arg of args) {
      if (arg in context) {
        const value = context[arg];
        if (typeof value === 'number') {
          values.push(value);
        } else {
          throw new Error(`Variable ${arg} is not a number`);
        }
      } else if (!isNaN(Number(arg))) {
        values.push(Number(arg));
      } else {
        try {
          const result = this.evaluateExpression(arg, context);
          if (typeof result === 'number') {
            values.push(result);
          } else {
            throw new Error(`Invalid argument: ${arg}`);
          }
        } catch {
          throw new Error(`Invalid argument: ${arg}`);
        }
      }
    }

    return values;
  }

  private static evaluateExpression(expression: string, context: FormulaContext = {}): number {
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    if (sanitized !== expression && Object.keys(context).length === 0) {
      throw new Error('Expression contains invalid characters');
    }

    let processedExpression = expression;
    for (const [variable, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${variable}\\b`, 'g');
      processedExpression = processedExpression.replace(regex, value.toString());
    }

    try {
      const result = Function(`"use strict"; return (${processedExpression})`)();
      if (typeof result !== 'number' || isNaN(result)) {
        throw new Error('Expression did not evaluate to a number');
      }
      return result;
    } catch (error) {
      throw new Error(`Invalid expression: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static validateExpression(expression: string, variables: string[] = []): boolean {
    try {
      const testContext: FormulaContext = {};
      variables.forEach(variable => {
        testContext[variable] = 1;
      });

      let testExpression = expression;
      for (const variable of variables) {
        const regex = new RegExp(`\\b${variable}\\b`, 'g');
        testExpression = testExpression.replace(regex, '1');
      }

      this.evaluateExpression(testExpression);
      return true;
    } catch {
      return false;
    }
  }

  static extractVariables(expression: string): string[] {
    const variableRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const matches = expression.match(variableRegex) || [];
    
    const validFunctions = ['sum', 'average', 'avg', 'min', 'max', 'count', 'percentage'];
    const variables = matches.filter(match => 
      !validFunctions.includes(match.toLowerCase()) &&
      isNaN(Number(match))
    );
    
    return [...new Set(variables)];
  }
}