# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a KPI CLI application for managing staff performance indicators, designed to be API-ready for future development. The system allows:

- **KPI Management**: Create KPIs with names, descriptions, calculation formulas, raw data requirements, target values, and scoring criteria (1-5 points)
- **Staff Organization**: Staff can be grouped by departments
- **Weight Assignment**: Each KPI can have configurable weights
- **Quarterly Tracking**: Monitor performance on a quarterly basis
- **Reporting**: Generate quarterly and annual summary reports with scores

## Technology Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Database**: SQLite with Drizzle ORM (TypeScript-first, migration-ready)
- **CLI Framework**: Commander.js with inquirer for interactive prompts
- **Validation**: Zod for schema validation and type safety
- **Testing**: Vitest with comprehensive test coverage
- **Development**: tsx for TypeScript execution, nodemon for hot reload

## Database Schema (SQLite)

### Core Tables
- **departments**: id, name, description, timestamps
- **staff**: id, employee_id, name, email, department_id, position, hire_date, active, timestamps
- **kpis**: id, name, description, formula_json, raw_data_schema_json, target_value, scoring_criteria_json, weight, active, timestamps
- **staff_kpis**: Many-to-many relationship between staff and KPIs
- **raw_data_entries**: Stores raw data for KPI calculations by period
- **evaluations**: Calculated KPI results and scores
- **evaluation_summaries**: Aggregated quarterly/annual performance summaries

## Project Architecture (API-Ready)

```
src/
├── cli/
│   ├── commands/    # CLI command handlers (department, staff, kpi, data, report)
│   └── index.ts     # CLI entry point
├── core/
│   ├── services/    # Business logic layer (reusable for future API)
│   ├── models/      # Domain models and TypeScript interfaces
│   └── utils/       # Formula engine, scoring engine, date utilities
├── database/
│   ├── schema.ts    # Drizzle schema definitions
│   ├── migrations/  # Database migration files
│   └── connection.ts # Database connection management
├── types/           # Shared TypeScript type definitions
└── config/          # Configuration management
```

## Development Commands

```bash
# Development
npm run dev          # Start development with hot reload
npm run build        # Build TypeScript to JavaScript
npm run test         # Run test suite with Vitest
npm run test:watch   # Run tests in watch mode
npm run lint         # ESLint code checking
npm run type-check   # TypeScript type checking

# Database
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Drizzle Studio for database inspection

# CLI Usage (after build)
npm run cli department create    # Create new department
npm run cli staff create         # Add new staff member
npm run cli kpi create           # Define new KPI
npm run cli data entry           # Enter raw data for evaluations
npm run cli report quarterly     # Generate quarterly reports
npm run cli report annual       # Generate annual summary
```

## Key Design Patterns

### Service Layer Pattern
All business logic is implemented in the service layer (`src/core/services/`), making it immediately reusable for future API development. CLI commands are thin wrappers around service calls.

### Domain-Driven Design
- Models represent core business entities
- Services handle business operations and validation
- Utilities handle technical concerns (formulas, scoring)

### Data Storage Strategy
- Complex data (formulas, scoring criteria, raw data) stored as JSON columns for flexibility
- Quarterly periods indexed as year/quarter combinations for efficient querying
- Soft deletes using active flags to maintain data integrity

## Formula System

KPI formulas are stored as JSON and can reference raw data fields. The formula engine supports:
- Basic arithmetic operations (+, -, *, /)
- Mathematical functions (sum, average, min, max)
- Conditional logic for complex calculations
- Variable substitution from raw data

## Scoring System

Scoring criteria define how calculated KPI values map to 1-5 point scores:
```json
{
  "ranges": [
    {"min": 0, "max": 50, "score": 1},
    {"min": 51, "max": 70, "score": 2},
    {"min": 71, "max": 85, "score": 3},
    {"min": 86, "max": 95, "score": 4},
    {"min": 96, "max": 100, "score": 5}
  ]
}
```

## Current Implementation Status

### ✅ Complete Implementation: Production-Ready KPI Management System

**All Features Complete:**
- ✅ **Department Management**: Full CRUD operations with CLI
- ✅ **Staff Management**: Complete staff lifecycle with department integration and performance tracking
- ✅ **KPI Management**: Comprehensive KPI definition with formulas, scoring, and analytics
- ✅ **Data Entry System**: Interactive data collection with schema validation and real-time calculations
- ✅ **Evaluation Engine**: Automated KPI calculation with weighted scoring and grade assignment
- ✅ **Reporting System**: Comprehensive quarterly and annual reports with trend analysis
- ✅ **Staff-KPI Assignment**: Complete assignment management and tracking
- ✅ **Formula Engine**: Arithmetic and function-based calculations with validation
- ✅ **Scoring System**: 1-5 point scoring with multiple criteria types
- ✅ **Database**: Full SQLite schema with 7 tables, relationships, and demo data
- ✅ **Interactive CLI**: Complete command structure with Thai language support
- ✅ **Analytics Dashboard**: Performance insights, bulk operations, and advanced analytics

**All CLI Commands Working:**
```bash
# Department operations
npm run cli department list/create/update/delete <id>

# Staff operations  
npm run cli staff list/create/show/update/activate/deactivate <id>

# KPI operations
npm run cli kpi list/create/show/update/test-formula/activate/deactivate <id>

# Data entry and evaluation
npm run cli data entry [--staff <id>] [--kpi <id>] [--year <year>] [--quarter <quarter>]
npm run cli data list [--staff <id>] [--kpi <id>] [--department <id>] [--year <year>] [--quarter <quarter>]

# Reports and analytics
npm run cli report quarterly [--department <id>] [--year <year>] [--quarter <quarter>]
npm run cli report annual [--department <id>] [--year <year>]

# Interactive mode (recommended)
npm run cli interactive  # Full feature access with Thai interface
```

### 📊 Demo Data and Performance Metrics

**Included Demo Data:**
- **Department**: แผนกบัญชีและการเงิน (Accounting & Finance Department)
- **Staff**: 3 employees with different roles and performance levels
- **KPIs**: 5 comprehensive KPIs with realistic formulas and scoring criteria
- **Raw Data**: Complete Q1 2025 performance data for all staff
- **Evaluations**: Calculated scores and grades with trend analysis

**Current Performance Results:**
- **Department Average**: 77.57% (Grade Distribution: 1 B, 2 C)
- **Top Performer**: คุณสมใจ วิเชียรชาญ (87.14%, Grade B)
- **KPI Coverage**: 5 active KPIs with full data coverage and calculations
- **Reporting**: Working quarterly and annual reports with analytics

### 🎯 Advanced Features Implemented

**Interactive Mode Features:**
- Advanced analytics dashboard with performance insights
- Bulk operations for data entry and staff assignments  
- Staff performance tracking with individual reports
- KPI formula testing and validation framework
- Export capabilities for reports and analytics
- Multi-language support (Thai/English interface)

**Formula Engine Capabilities:**
- Arithmetic expressions: `((budget - actual_cost) / budget) * 100`
- Variable substitution from raw data
- Real-time validation and testing
- Error handling for missing variables

**Scoring System Features:**
- Linear scaling with configurable ranges (1-5 points)
- Percentage-based criteria (0-100%)
- Weighted score calculations
- Automatic grade assignment (A, B+, B, C+, C, D+, D, F)
- Target achievement tracking

## API Migration Strategy

The service layer architecture enables zero-duplication API migration:
1. Add Express.js/Fastify routing layer
2. Implement authentication middleware  
3. Add API response formatters
4. Create OpenAPI documentation

All business logic remains in the service layer, immediately reusable for REST endpoints.

## Testing and Quality Assurance

### ✅ Comprehensive Testing Completed

**System Testing:**
- ✅ All CLI commands tested and verified
- ✅ Interactive mode fully functional
- ✅ Database operations tested with demo data
- ✅ Formula engine calculations verified
- ✅ Scoring system accuracy confirmed
- ✅ Report generation tested with real data
- ✅ Performance analytics validated

**Code Quality:**
- ✅ TypeScript compilation: No errors
- ✅ ESLint compliance: Minor warnings only (acceptable)
- ✅ Type safety: Comprehensive type definitions
- ✅ Error handling: Robust error management
- ✅ Memory management: Proper database connection handling

**Demo Data Validation:**
- ✅ 3 staff members with complete profiles
- ✅ 5 KPIs with working formulas and scoring
- ✅ 10 raw data entries for Q1 2025
- ✅ Calculated evaluations with realistic scores
- ✅ Department performance metrics validated

### 🚀 Deployment Status

**Production Ready:**
- ✅ Built and tested TypeScript compilation
- ✅ Database schema with migrations
- ✅ Complete demo data for immediate use
- ✅ All CLI commands functional
- ✅ Interactive mode fully operational
- ✅ Reporting system generating accurate results

**Repository Status:**
- ✅ GitHub repository: https://github.com/witoon-skydea/KPI-cli1
- ✅ Complete documentation (README.md, CLAUDE.md)
- ✅ Working build system (npm run build)
- ✅ Development environment configured
- ✅ Demo data seeded and ready

## Usage Examples

### Quick Start Example
```bash
# Clone and setup
git clone https://github.com/witoon-skydea/KPI-cli1.git
cd KPI-cli1
npm install && npm run db:migrate && npm run db:seed && npm run build

# View demo data
node dist/cli/index.js department list
node dist/cli/index.js staff list
node dist/cli/index.js kpi list

# Generate reports
node dist/cli/index.js report quarterly --department 1 --year 2025 --quarter 1
node dist/cli/index.js report annual --department 1 --year 2025

# Start interactive mode
node dist/cli/index.js interactive
```

### Real Data Examples
**Current demo includes:**
- แผนกบัญชีและการเงิน with 3 staff members
- 5 realistic KPIs for accounting department
- Q1 2025 performance data with calculated scores
- Working formulas like cost control: `((budget - actual_cost) / budget) * 100`
- Grade distribution: 1 B grade, 2 C grades
- Department average: 77.57%