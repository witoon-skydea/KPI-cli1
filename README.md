# KPI CLI - Performance Management System

A comprehensive command-line interface for managing staff Key Performance Indicators (KPIs) with SQLite database backend, designed to be API-ready for future development.

## Features

### ✅ Current Implementation

- **Department Management**: Complete CRUD operations for organizational structure
- **Staff Management**: Full employee lifecycle with department integration
- **KPI Management**: Advanced KPI definition with formulas and scoring systems
- **Formula Engine**: Support for arithmetic expressions and mathematical functions
- **Scoring System**: Flexible 1-5 point scoring with multiple criteria types
- **Interactive CLI**: Professional command interface with colored output and tables

### 🚧 Upcoming Features

- Data entry system for quarterly KPI tracking
- Staff-KPI assignment management
- Quarterly and annual reporting
- Performance analytics and insights

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Database**: SQLite with Drizzle ORM
- **CLI Framework**: Commander.js with inquirer prompts
- **Validation**: Zod for schema validation
- **Testing**: Vitest framework
- **Code Quality**: ESLint + TypeScript strict mode

## Quick Start

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd KPI-cli1

# Install dependencies
npm install

# Setup database
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### Development

```bash
# Start development
npm run dev

# Build project
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## CLI Usage

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
├── cli/            # Command-line interface
├── core/
│   ├── services/   # Business logic (API-ready)
│   ├── models/     # Domain models and types
│   └── utils/      # Formula and scoring engines
├── database/       # Schema and migrations
├── types/          # TypeScript definitions
└── config/         # Configuration
```

### Formula System
KPIs support complex formulas with:
- Basic arithmetic operations (`+`, `-`, `*`, `/`)
- Mathematical functions (`sum`, `average`, `min`, `max`, `percentage`)
- Variable substitution from raw data
- Real-time validation and testing

### Scoring System
Flexible 1-5 point scoring with:
- Linear scaling (min-max ranges)
- Percentage-based criteria (0-100%)
- Inverse scaling (lower is better)
- Custom range definitions

## API Migration

The service layer architecture enables zero-duplication API migration:

1. Add Express.js/Fastify routing layer
2. Implement authentication middleware
3. Add API response formatters
4. Create OpenAPI documentation

All business logic remains in the service layer, immediately reusable for REST endpoints.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details