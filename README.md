# KPI CLI - Performance Management System

A comprehensive command-line interface for managing staff Key Performance Indicators (KPIs) with SQLite database backend, designed to be API-ready for future development.

## Features

### ✅ Complete Implementation

- **Department Management**: Complete CRUD operations for organizational structure
- **Staff Management**: Full employee lifecycle with department integration and performance tracking
- **KPI Management**: Advanced KPI definition with formulas, scoring systems, and analytics
- **Data Entry System**: Interactive data collection with schema validation and real-time calculations
- **Evaluation Engine**: Automated KPI calculation with weighted scoring and grade assignment
- **Reporting System**: Comprehensive quarterly and annual reports with trend analysis
- **Interactive CLI**: Professional command interface with Thai language support
- **Formula Engine**: Support for arithmetic expressions and mathematical functions
- **Scoring System**: Flexible 1-5 point scoring with multiple criteria types
- **Analytics Dashboard**: Performance insights, bulk operations, and advanced analytics

### 🎯 Key Capabilities

- **Real-time KPI Calculations**: Automatic evaluation with formula engine
- **Performance Tracking**: Quarterly and annual performance summaries
- **Grade Assignment**: Automatic A-F grading with percentage scores
- **Trend Analysis**: Performance trends with improvement tracking
- **Bulk Operations**: Mass data entry and staff assignments
- **Export Features**: Report generation with detailed analytics

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Database**: SQLite with Drizzle ORM
- **CLI Framework**: Commander.js with inquirer prompts
- **Validation**: Zod for schema validation
- **Testing**: Vitest framework
- **Code Quality**: ESLint + TypeScript strict mode
- **UI/UX**: Chalk for colored output, CLI tables, Thai language interface

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/witoon-skydea/KPI-cli1.git
cd KPI-cli1

# Install dependencies
npm install

# Setup database and seed with demo data
npm run db:migrate
npm run db:seed

# Build the project
npm run build
```

### Development

```bash
# Start development with hot reload
npm run dev

# Build project
npm run build

# Run tests
npm run test

# Lint and type check
npm run lint
npm run type-check

# Database operations
npm run db:studio    # Open database browser
npm run db:generate  # Generate migrations
```

## CLI Usage

### Interactive Mode (Recommended)
```bash
# Start interactive mode with full feature access
npm run cli interactive

# Or use the built version
node dist/cli/index.js interactive
```

### Department Management
```bash
npm run cli department list
npm run cli department create
npm run cli department update <id>
npm run cli department delete <id>
```

### Staff Management
```bash
npm run cli staff list [--active-only] [--department <id>]
npm run cli staff create
npm run cli staff show <id>
npm run cli staff update <id>
npm run cli staff activate/deactivate <id>
```

### KPI Management
```bash
npm run cli kpi list [--active-only]
npm run cli kpi create
npm run cli kpi show <id>
npm run cli kpi test-formula <id>
npm run cli kpi update <id>
npm run cli kpi activate/deactivate <id>
```

### Data Entry and Evaluation
```bash
# Enter raw data for KPI calculations
npm run cli data entry [--staff <id>] [--kpi <id>] [--year <year>] [--quarter <quarter>]

# List data entries with filtering
npm run cli data list [--staff <id>] [--kpi <id>] [--department <id>] [--year <year>] [--quarter <quarter>]
```

### Reports and Analytics
```bash
# Generate quarterly reports
npm run cli report quarterly [--department <id>] [--year <year>] [--quarter <quarter>]

# Generate annual reports
npm run cli report annual [--department <id>] [--year <year>]
```

## Database Schema

The system uses SQLite with the following core tables:

- **departments**: Organizational structure
- **staff**: Employee records with department assignments
- **kpis**: KPI definitions with formulas and scoring criteria
- **staff_kpis**: Many-to-many staff-KPI assignments
- **raw_data_entries**: Raw data for KPI calculations
- **evaluations**: Calculated KPI results and scores
- **evaluation_summaries**: Aggregated performance summaries

## Architecture

### Service Layer Pattern
All business logic is implemented in the service layer (`src/core/services/`), making it immediately reusable for future API development.

```
src/
├── cli/
│   ├── commands/       # CLI command handlers
│   ├── interactive.ts  # Interactive mode with full features
│   └── index.ts        # CLI entry point
├── core/
│   ├── services/       # Business logic (API-ready)
│   │   ├── DepartmentService.ts
│   │   ├── StaffService.ts
│   │   ├── KPIService.ts
│   │   ├── DataEntryService.ts
│   │   ├── EvaluationService.ts
│   │   ├── ReportService.ts
│   │   └── StaffKPIService.ts
│   ├── models/         # Domain models and types
│   └── utils/          # Formula and scoring engines
├── database/
│   ├── schema.ts       # Database schema definitions
│   ├── migrations/     # Database migration files
│   └── demo-data/      # Sample data for testing
├── types/              # TypeScript definitions
└── config/             # Configuration
```

### Formula System
KPIs support complex formulas with:
- Basic arithmetic operations (`+`, `-`, `*`, `/`)
- Mathematical functions (`sum`, `average`, `min`, `max`, `percentage`)
- Variable substitution from raw data
- Real-time validation and testing

Example formula:
```json
{
  "type": "arithmetic",
  "expression": "((budget - actual_cost) / budget) * 100",
  "variables": ["budget", "actual_cost"]
}
```

### Scoring System
Flexible 1-5 point scoring with:
- Linear scaling (min-max ranges)
- Percentage-based criteria (0-100%)
- Inverse scaling (lower is better)
- Custom range definitions

Example scoring criteria:
```json
{
  "type": "linear",
  "ranges": [
    {"min": 0, "max": 50, "score": 1},
    {"min": 51, "max": 70, "score": 2},
    {"min": 71, "max": 85, "score": 3},
    {"min": 86, "max": 95, "score": 4},
    {"min": 96, "max": 100, "score": 5}
  ]
}
```

### Reporting Features

**Quarterly Reports Include:**
- Department performance summaries
- Individual staff evaluations
- KPI performance analysis
- Grade distributions
- Top performer identification

**Annual Reports Include:**
- Yearly performance trends
- Quarterly comparisons
- Staff annual averages
- Improvement tracking
- Performance analytics

### Demo Data
The system includes comprehensive demo data:
- **Department**: แผนกบัญชีและการเงิน (Accounting & Finance)
- **Staff**: 3 employees with different roles and performance levels
- **KPIs**: 5 comprehensive KPIs with realistic formulas and scoring
- **Data**: Complete Q1 2025 performance data
- **Evaluations**: Calculated scores and grades for all staff

## Performance Metrics

**Current Demo Results:**
- **Department Average**: 77.57%
- **Top Performer**: คุณสมใจ วิเชียรชาญ (87.14%, Grade B)
- **Grade Distribution**: 1 B, 2 C grades
- **KPI Coverage**: 5 active KPIs with full data coverage

## API Migration

The service layer architecture enables zero-duplication API migration:

1. Add Express.js/Fastify routing layer
2. Implement authentication middleware
3. Add API response formatters
4. Create OpenAPI documentation

All business logic remains in the service layer, immediately reusable for REST endpoints.

## Development Guidelines

### Code Quality
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Comprehensive error handling
- Service layer abstraction for API readiness

### Testing
- Vitest framework configured
- Service layer unit testing ready
- CLI command testing
- Database operation testing

### Internationalization
- Thai language interface
- Localized date formatting
- Unicode support for names and descriptions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with proper TypeScript types
4. Run tests and linting (`npm run lint`, `npm run type-check`)
5. Test CLI functionality thoroughly
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker:
https://github.com/witoon-skydea/KPI-cli1/issues