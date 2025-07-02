import type { ScoringCriteria } from '../../types/index.js';

export class ScoringEngine {
  static calculateScore(value: number, criteria: ScoringCriteria): number {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('Value must be a valid number');
    }

    if (!criteria.ranges || criteria.ranges.length === 0) {
      throw new Error('Scoring criteria must have at least one range');
    }

    for (const range of criteria.ranges) {
      if (value >= range.min && value <= range.max) {
        return range.score;
      }
    }

    const minRange = criteria.ranges.reduce((min, range) => 
      range.min < min.min ? range : min
    );
    const maxRange = criteria.ranges.reduce((max, range) => 
      range.max > max.max ? range : max
    );

    if (value < minRange.min) {
      return 1;
    }
    
    if (value > maxRange.max) {
      return 5;
    }

    throw new Error('Value does not match any scoring range');
  }

  static createLinearScoringCriteria(
    minValue: number, 
    maxValue: number, 
    minScore: number = 1, 
    maxScore: number = 5
  ): ScoringCriteria {
    if (minValue >= maxValue) {
      throw new Error('Minimum value must be less than maximum value');
    }
    
    if (minScore < 1 || maxScore > 5 || minScore >= maxScore) {
      throw new Error('Scores must be between 1-5 and minScore must be less than maxScore');
    }

    const range = maxValue - minValue;
    const step = range / 5; // Always 5 ranges for scores 1-5

    const ranges = [];
    for (let score = 1; score <= 5; score++) {
      const rangeMin = minValue + (score - 1) * step;
      const rangeMax = score === 5 ? maxValue : minValue + score * step - 0.01;
      
      ranges.push({
        min: Number(rangeMin.toFixed(2)),
        max: Number(rangeMax.toFixed(2)),
        score: score
      });
    }

    return { ranges };
  }

  static createPercentageScoringCriteria(): ScoringCriteria {
    return {
      ranges: [
        { min: 0, max: 50, score: 1 },
        { min: 50.01, max: 70, score: 2 },
        { min: 70.01, max: 85, score: 3 },
        { min: 85.01, max: 95, score: 4 },
        { min: 95.01, max: 100, score: 5 }
      ]
    };
  }

  static createInverseScoringCriteria(
    minValue: number,
    maxValue: number
  ): ScoringCriteria {
    if (minValue >= maxValue) {
      throw new Error('Minimum value must be less than maximum value');
    }

    const range = maxValue - minValue;
    const step = range / 5;

    return {
      ranges: [
        { min: minValue, max: minValue + step, score: 5 },
        { min: minValue + step + 0.01, max: minValue + 2 * step, score: 4 },
        { min: minValue + 2 * step + 0.01, max: minValue + 3 * step, score: 3 },
        { min: minValue + 3 * step + 0.01, max: minValue + 4 * step, score: 2 },
        { min: minValue + 4 * step + 0.01, max: maxValue, score: 1 }
      ]
    };
  }

  static validateScoringCriteria(criteria: ScoringCriteria): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!criteria.ranges || !Array.isArray(criteria.ranges)) {
      errors.push('Scoring criteria must have a ranges array');
      return { valid: false, errors };
    }

    if (criteria.ranges.length === 0) {
      errors.push('Scoring criteria must have at least one range');
      return { valid: false, errors };
    }

    const sortedRanges = [...criteria.ranges].sort((a, b) => a.min - b.min);
    
    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      if (!range) continue;
      
      if (typeof range.min !== 'number' || typeof range.max !== 'number' || typeof range.score !== 'number') {
        errors.push(`Range ${i + 1}: min, max, and score must be numbers`);
        continue;
      }
      
      if (range.min >= range.max) {
        errors.push(`Range ${i + 1}: min value (${range.min}) must be less than max value (${range.max})`);
      }
      
      if (range.score < 1 || range.score > 5 || !Number.isInteger(range.score)) {
        errors.push(`Range ${i + 1}: score must be an integer between 1 and 5`);
      }
      
      const prevRange = sortedRanges[i - 1];
      if (i > 0 && prevRange && prevRange.max >= range.min) {
        errors.push(`Range ${i + 1}: overlaps with previous range`);
      }
    }

    const scores = new Set(criteria.ranges.map(r => r.score));
    if (scores.size !== criteria.ranges.length) {
      errors.push('Each range must have a unique score');
    }

    return { valid: errors.length === 0, errors };
  }

  static getScoreDescription(score: number): string {
    switch (score) {
      case 1: return 'Poor - Significantly below expectations';
      case 2: return 'Below Average - Below expectations';
      case 3: return 'Average - Meets expectations';
      case 4: return 'Good - Exceeds expectations';
      case 5: return 'Excellent - Significantly exceeds expectations';
      default: return 'Invalid score';
    }
  }

  static calculateWeightedScore(scores: Array<{ score: number; weight: number }>): {
    totalWeightedScore: number;
    maxPossibleScore: number;
    percentageScore: number;
  } {
    if (scores.length === 0) {
      throw new Error('Cannot calculate weighted score with no scores');
    }

    let totalWeighted = 0;
    let totalWeight = 0;

    for (const { score, weight } of scores) {
      if (typeof score !== 'number' || score < 1 || score > 5) {
        throw new Error('All scores must be numbers between 1 and 5');
      }
      if (typeof weight !== 'number' || weight <= 0) {
        throw new Error('All weights must be positive numbers');
      }
      
      totalWeighted += score * weight;
      totalWeight += weight;
    }

    const maxPossibleScore = totalWeight * 5;
    const percentageScore = (totalWeighted / maxPossibleScore) * 100;

    return {
      totalWeightedScore: Number(totalWeighted.toFixed(2)),
      maxPossibleScore: Number(maxPossibleScore.toFixed(2)),
      percentageScore: Number(percentageScore.toFixed(2))
    };
  }

  static getGradeFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}