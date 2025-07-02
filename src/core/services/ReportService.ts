import { StaffService } from './StaffService.js';
import { DepartmentService } from './DepartmentService.js';
import { KPIService } from './KPIService.js';
import { EvaluationService } from './EvaluationService.js';
import type { Staff, Department, KPI, Evaluation, EvaluationSummary } from '../../types/index.js';

export interface QuarterlyReportData {
  period: {
    year: number;
    quarter: number;
    displayName: string;
  };
  department: Department;
  staffReports: StaffQuarterlyReport[];
  departmentSummary: DepartmentSummary;
}

export interface StaffQuarterlyReport {
  staff: Staff;
  evaluations: EvaluationWithKPI[];
  summary: EvaluationSummary;
}

export interface EvaluationWithKPI extends Evaluation {
  kpi: KPI;
}

export interface DepartmentSummary {
  totalStaff: number;
  averageScore: number;
  gradeDistribution: Record<string, number>;
  topPerformers: Staff[];
  kpiPerformance: KPIPerformanceSummary[];
}

export interface KPIPerformanceSummary {
  kpi: KPI;
  averageScore: number;
  staffCount: number;
  targetAchievement: number;
}

export interface AnnualReportData {
  period: {
    year: number;
    displayName: string;
  };
  department: Department;
  quarterlyTrends: QuarterlyTrend[];
  annualSummary: AnnualSummary;
  staffAnnualReports: StaffAnnualReport[];
}

export interface QuarterlyTrend {
  quarter: number;
  averageScore: number;
  staffCount: number;
  topPerformer?: Staff;
}

export interface AnnualSummary {
  totalStaff: number;
  yearlyAverageScore: number;
  bestQuarter: number;
  worstQuarter: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  gradeDistribution: Record<string, number>;
  topPerformers: Staff[];
  kpiPerformance: KPIAnnualPerformance[];
}

export interface StaffAnnualReport {
  staff: Staff;
  quarterlyScores: Record<number, number>;
  annualAverage: number;
  annualGrade: string;
  trend: 'improving' | 'declining' | 'stable';
  bestQuarter: number;
  worstQuarter: number;
}

export interface KPIAnnualPerformance {
  kpi: KPI;
  quarterlyAverages: Record<number, number>;
  annualAverage: number;
  trend: 'improving' | 'declining' | 'stable';
  staffCount: number;
  bestQuarter: number;
}

export class ReportService {
  private staffService = new StaffService();
  private departmentService = new DepartmentService();
  private kpiService = new KPIService();
  private evaluationService = new EvaluationService();

  async generateQuarterlyReport(
    departmentId: number,
    year: number,
    quarter: number
  ): Promise<QuarterlyReportData> {
    // ดึงข้อมูลแผนก
    const department = await this.departmentService.findById(departmentId);
    if (!department) {
      throw new Error('ไม่พบแผนกที่ระบุ');
    }

    // ดึงพนักงานในแผนก
    const departmentStaff = await this.staffService.findByDepartment(departmentId);
    if (departmentStaff.length === 0) {
      throw new Error('ไม่พบพนักงานในแผนกนี้');
    }

    const staffReports: StaffQuarterlyReport[] = [];

    // สร้างรายงานสำหรับแต่ละพนักงาน
    for (const staff of departmentStaff) {
      try {
        const summary = await this.evaluationService.calculateStaffSummary(
          staff.id,
          year,
          quarter
        );

        const evaluations = await this.evaluationService.getStaffEvaluations(
          staff.id,
          year,
          quarter
        );

        const evaluationsWithKPI: EvaluationWithKPI[] = [];
        for (const evaluation of evaluations) {
          const kpi = await this.kpiService.findById(evaluation.kpiId);
          if (kpi) {
            evaluationsWithKPI.push({
              ...evaluation,
              kpi
            });
          }
        }

        staffReports.push({
          staff,
          evaluations: evaluationsWithKPI,
          summary
        });
      } catch (error) {
        // พนักงานที่ไม่มีข้อมูลประเมิน จะไม่รวมในรายงาน
        console.warn(`ไม่พบข้อมูลประเมินสำหรับ ${staff.name}`);
      }
    }

    if (staffReports.length === 0) {
      throw new Error('ไม่พบข้อมูลการประเมินสำหรับช่วงเวลาที่ระบุ');
    }

    // สร้างสรุประดับแผนก
    const departmentSummary = await this.generateDepartmentSummary(
      staffReports,
      year,
      quarter
    );

    return {
      period: {
        year,
        quarter,
        displayName: `ไตรมาสที่ ${quarter} ปี ${year}`
      },
      department,
      staffReports,
      departmentSummary
    };
  }

  private async generateDepartmentSummary(
    staffReports: StaffQuarterlyReport[],
    year: number,
    quarter: number
  ): Promise<DepartmentSummary> {
    const totalStaff = staffReports.length;
    
    // คำนวณคะแนนเฉลี่ย
    const totalScore = staffReports.reduce((sum, report) => 
      sum + (report.summary.percentageScore || 0), 0
    );
    const averageScore = totalScore / totalStaff;

    // สร้างการกระจายของเกรด
    const gradeDistribution: Record<string, number> = {};
    staffReports.forEach(report => {
      const grade = report.summary.grade || 'F';
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // หาผู้มีผลงานดีเด่น (เกรด A และ B+)
    const topPerformers = staffReports
      .filter(report => ['A', 'B+'].includes(report.summary.grade || ''))
      .sort((a, b) => (b.summary.percentageScore || 0) - (a.summary.percentageScore || 0))
      .slice(0, 3)
      .map(report => report.staff);

    // วิเคราะห์ผลการดำเนินงานแต่ละ KPI
    const kpiPerformanceMap = new Map<number, {
      kpi: KPI;
      scores: number[];
      targetValues: number[];
      calculatedValues: number[];
    }>();

    staffReports.forEach(staffReport => {
      staffReport.evaluations.forEach(evaluation => {
        const kpiId = evaluation.kpiId;
        
        if (!kpiPerformanceMap.has(kpiId)) {
          kpiPerformanceMap.set(kpiId, {
            kpi: evaluation.kpi,
            scores: [],
            targetValues: [],
            calculatedValues: []
          });
        }

        const kpiData = kpiPerformanceMap.get(kpiId)!;
        kpiData.scores.push(evaluation.score || 0);
        kpiData.calculatedValues.push(evaluation.calculatedValue || 0);
        if (evaluation.targetValue) {
          kpiData.targetValues.push(evaluation.targetValue);
        }
      });
    });

    const kpiPerformance: KPIPerformanceSummary[] = Array.from(kpiPerformanceMap.entries())
      .map(([kpiId, data]) => {
        const averageScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
        const averageTarget = data.targetValues.length > 0 
          ? data.targetValues.reduce((sum, target) => sum + target, 0) / data.targetValues.length
          : 0;
        const averageCalculated = data.calculatedValues.reduce((sum, calc) => sum + calc, 0) / data.calculatedValues.length;
        
        const targetAchievement = averageTarget > 0 
          ? (averageCalculated / averageTarget) * 100 
          : 100;

        return {
          kpi: data.kpi,
          averageScore,
          staffCount: data.scores.length,
          targetAchievement: Math.round(targetAchievement * 100) / 100
        };
      })
      .sort((a, b) => b.averageScore - a.averageScore);

    return {
      totalStaff,
      averageScore: Math.round(averageScore * 100) / 100,
      gradeDistribution,
      topPerformers,
      kpiPerformance
    };
  }

  async getAllDepartments(): Promise<Department[]> {
    return await this.departmentService.findAll();
  }

  formatPercentage(value: number): string {
    return `${Math.round(value * 100) / 100}%`;
  }

  formatScore(score: number): string {
    return `${Math.round(score * 10) / 10}/5`;
  }

  async generateAnnualReport(
    departmentId: number,
    year: number
  ): Promise<AnnualReportData> {
    // ดึงข้อมูลแผนก
    const department = await this.departmentService.findById(departmentId);
    if (!department) {
      throw new Error('ไม่พบแผนกที่ระบุ');
    }

    // ดึงพนักงานในแผนก
    const departmentStaff = await this.staffService.findByDepartment(departmentId);
    if (departmentStaff.length === 0) {
      throw new Error('ไม่พบพนักงานในแผนกนี้');
    }

    // สร้างรายงานรายไตรมาส
    const quarterlyTrends: QuarterlyTrend[] = [];
    const staffQuarterlyData = new Map<number, Record<number, number>>();
    
    for (let quarter = 1; quarter <= 4; quarter++) {
      try {
        const quarterlyReport = await this.generateQuarterlyReport(departmentId, year, quarter);
        
        // เก็บข้อมูลแนวโน้มรายไตรมาส
        const topPerformer = quarterlyReport.departmentSummary.topPerformers[0];
        quarterlyTrends.push({
          quarter,
          averageScore: quarterlyReport.departmentSummary.averageScore,
          staffCount: quarterlyReport.departmentSummary.totalStaff,
          ...(topPerformer && { topPerformer })
        });

        // เก็บคะแนนรายบุคคลแต่ละไตรมาส
        quarterlyReport.staffReports.forEach(staffReport => {
          if (!staffQuarterlyData.has(staffReport.staff.id)) {
            staffQuarterlyData.set(staffReport.staff.id, {});
          }
          staffQuarterlyData.get(staffReport.staff.id)![quarter] = staffReport.summary.percentageScore || 0;
        });
      } catch (error) {
        // ไตรมาสที่ไม่มีข้อมูล
        quarterlyTrends.push({
          quarter,
          averageScore: 0,
          staffCount: 0
        });
      }
    }

    // สร้างรายงานรายบุคคลประจำปี
    const staffAnnualReports: StaffAnnualReport[] = [];
    
    for (const staff of departmentStaff) {
      const quarterlyScores = staffQuarterlyData.get(staff.id) || {};
      const scores = Object.values(quarterlyScores).filter(score => score > 0);
      
      if (scores.length === 0) continue;
      
      const annualAverage = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const annualGrade = this.calculateGradeFromPercentage(annualAverage);
      
      // คำนวณแนวโน้ม
      const trend = this.calculateTrend(quarterlyScores);
      
      // หาไตรมาสที่ดีที่สุดและแย่ที่สุด
      const bestQuarter = Object.entries(quarterlyScores)
        .reduce((best, [quarter, score]) => 
          score > (quarterlyScores[best] || 0) ? parseInt(quarter) : best, 1
        );
      const worstQuarter = Object.entries(quarterlyScores)
        .reduce((worst, [quarter, score]) => 
          score < (quarterlyScores[worst] || 100) ? parseInt(quarter) : worst, 1
        );
      
      staffAnnualReports.push({
        staff,
        quarterlyScores,
        annualAverage,
        annualGrade,
        trend,
        bestQuarter,
        worstQuarter
      });
    }

    // สร้างสรุปรายปี
    const annualSummary = this.generateAnnualSummary(quarterlyTrends, staffAnnualReports, year);

    return {
      period: {
        year,
        displayName: `รายงานประจำปี ${year}`
      },
      department,
      quarterlyTrends,
      annualSummary,
      staffAnnualReports
    };
  }

  private generateAnnualSummary(
    quarterlyTrends: QuarterlyTrend[],
    staffAnnualReports: StaffAnnualReport[],
    year: number
  ): AnnualSummary {
    const totalStaff = staffAnnualReports.length;
    
    // คำนวณคะแนนเฉลี่ยรายปี
    const yearlyAverageScore = staffAnnualReports.reduce((sum, report) => 
      sum + report.annualAverage, 0
    ) / totalStaff;

    // หาไตรมาสที่ดีที่สุดและแย่ที่สุด
    const bestQuarter = quarterlyTrends.reduce((best, trend) => 
      trend.averageScore > (quarterlyTrends[best - 1]?.averageScore ?? 0) ? trend.quarter : best, 1
    );
    const worstQuarter = quarterlyTrends.reduce((worst, trend) => 
      trend.averageScore < (quarterlyTrends[worst - 1]?.averageScore ?? 100) ? trend.quarter : worst, 1
    );

    // คำนวณแนวโน้มการปรับปรุง
    const improvementTrend = this.calculateYearlyTrend(quarterlyTrends);

    // การกระจายของเกรด
    const gradeDistribution: Record<string, number> = {};
    staffAnnualReports.forEach(report => {
      const grade = report.annualGrade;
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // ผู้มีผลงานดีเด่น
    const topPerformers = staffAnnualReports
      .filter(report => ['A', 'B+'].includes(report.annualGrade))
      .sort((a, b) => b.annualAverage - a.annualAverage)
      .slice(0, 5)
      .map(report => report.staff);

    // วิเคราะห์ KPI แต่ละตัวตลอดปี
    const kpiPerformance: KPIAnnualPerformance[] = [];
    // Note: จะต้องใช้ข้อมูลจากการประเมินจริงในอนาคต

    return {
      totalStaff,
      yearlyAverageScore: Math.round(yearlyAverageScore * 100) / 100,
      bestQuarter,
      worstQuarter,
      improvementTrend,
      gradeDistribution,
      topPerformers,
      kpiPerformance
    };
  }

  private calculateGradeFromPercentage(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 85) return 'B+';
    if (percentage >= 80) return 'B';
    if (percentage >= 75) return 'C+';
    if (percentage >= 70) return 'C';
    if (percentage >= 65) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  private calculateTrend(quarterlyScores: Record<number, number>): 'improving' | 'declining' | 'stable' {
    const quarters = Object.keys(quarterlyScores).map(Number).sort();
    if (quarters.length < 2) return 'stable';
    
    const firstHalf = quarters.slice(0, Math.floor(quarters.length / 2))
      .reduce((sum, q) => sum + (quarterlyScores[q] ?? 0), 0) / Math.floor(quarters.length / 2);
    const secondHalf = quarters.slice(Math.floor(quarters.length / 2))
      .reduce((sum, q) => sum + (quarterlyScores[q] ?? 0), 0) / Math.ceil(quarters.length / 2);
    
    const difference = secondHalf - firstHalf;
    if (difference > 2) return 'improving';
    if (difference < -2) return 'declining';
    return 'stable';
  }

  private calculateYearlyTrend(quarterlyTrends: QuarterlyTrend[]): 'improving' | 'declining' | 'stable' {
    const validTrends = quarterlyTrends.filter(trend => trend.averageScore > 0);
    if (validTrends.length < 2) return 'stable';
    
    const firstHalf = validTrends.slice(0, Math.floor(validTrends.length / 2))
      .reduce((sum, trend) => sum + trend.averageScore, 0) / Math.floor(validTrends.length / 2);
    const secondHalf = validTrends.slice(Math.floor(validTrends.length / 2))
      .reduce((sum, trend) => sum + trend.averageScore, 0) / Math.ceil(validTrends.length / 2);
    
    const difference = secondHalf - firstHalf;
    if (difference > 2) return 'improving';
    if (difference < -2) return 'declining';
    return 'stable';
  }

  getGradeColor(grade: string): 'green' | 'blue' | 'yellow' | 'red' | 'gray' {
    switch (grade) {
      case 'A': return 'green';
      case 'B+': 
      case 'B': return 'blue';
      case 'C+':
      case 'C': return 'yellow';
      case 'D+':
      case 'D': return 'red';
      default: return 'gray';
    }
  }

  getTrendColor(trend: string): 'green' | 'red' | 'yellow' {
    switch (trend) {
      case 'improving': return 'green';
      case 'declining': return 'red';
      default: return 'yellow';
    }
  }

  getTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  }
}