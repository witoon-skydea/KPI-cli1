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
}