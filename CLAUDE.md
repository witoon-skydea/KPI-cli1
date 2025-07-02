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

### ✅ Phase 1 & 2 Complete: Foundation + Staff & KPI Management

**Completed Features:**
- ✅ **Department Management**: Full CRUD operations with CLI
- ✅ **Staff Management**: Complete staff lifecycle with department integration
- ✅ **KPI Management**: Comprehensive KPI definition with formulas and scoring
- ✅ **Formula Engine**: Arithmetic and function-based calculations with validation
- ✅ **Scoring System**: 1-5 point scoring with multiple criteria types
- ✅ **Database**: Full SQLite schema with 7 tables and relationships
- ✅ **CLI Interface**: Complete command structure for all operations

**Working CLI Commands:**
```bash
# Department operations
npm run cli department list
npm run cli department create
npm run cli department update <id>
npm run cli department delete <id>

# Staff operations  
npm run cli staff list [--active-only] [--department <id>]
npm run cli staff create
npm run cli staff show <id>
npm run cli staff update <id>
npm run cli staff activate/deactivate <id>

# KPI operations
npm run cli kpi list [--active-only]
npm run cli kpi create
npm run cli kpi show <id>
npm run cli kpi test-formula <id>
npm run cli kpi update <id>
npm run cli kpi activate/deactivate <id>
```

### 🚧 Next Phase: Data Collection & Evaluation System

**Pending Implementation:**
- Data entry system for raw KPI data collection
- Staff-KPI assignment management
- Quarterly evaluation calculations
- Reporting system (quarterly/annual summaries)
- Performance analytics and insights

## API Migration Strategy

The service layer architecture enables zero-duplication API migration:
1. Add Express.js/Fastify routing layer
2. Implement authentication middleware  
3. Add API response formatters
4. Create OpenAPI documentation

All business logic remains in the service layer, immediately reusable for REST endpoints.