# KPI Management System - Full-Stack Solution

A comprehensive **CLI + REST API** system for managing staff Key Performance Indicators (KPIs) with SQLite database backend. Features complete CLI interface and production-ready REST API with authentication, role-based access control, and interactive documentation.

## Features

### ✅ Complete Implementation

**🖥️ Command Line Interface:**
- **Department Management**: Complete CRUD operations for organizational structure
- **Staff Management**: Full employee lifecycle with department integration and performance tracking
- **KPI Management**: Advanced KPI definition with formulas, scoring systems, and analytics
- **Data Entry System**: Interactive data collection with schema validation and real-time calculations
- **Evaluation Engine**: Automated KPI calculation with weighted scoring and grade assignment
- **Reporting System**: Comprehensive quarterly and annual reports with trend analysis
- **Interactive CLI**: Professional command interface with Thai language support
- **Analytics Dashboard**: Performance insights, bulk operations, and advanced analytics

**🌐 REST API (Production Ready):**
- **Authentication & Security**: JWT-based auth with role-based access control (Admin/Manager/Employee)
- **Department API**: Full CRUD operations with pagination, filtering, and statistics
- **Staff API**: Complete staff management with performance analytics and search capabilities
- **Security Features**: Rate limiting, CORS, Helmet security headers, input validation
- **Documentation**: Interactive Swagger UI with OpenAPI 3.0 specification
- **Health Monitoring**: Comprehensive health checks and status monitoring

### 🎯 Key Capabilities

- **Real-time KPI Calculations**: Automatic evaluation with formula engine
- **Performance Tracking**: Quarterly and annual performance summaries
- **Grade Assignment**: Automatic A-F grading with percentage scores
- **Trend Analysis**: Performance trends with improvement tracking
- **Bulk Operations**: Mass data entry and staff assignments
- **Export Features**: Report generation with detailed analytics

## Tech Stack

**🔧 Core Technologies:**
- **Runtime**: Node.js 18+ with TypeScript (strict mode)
- **Database**: SQLite with Drizzle ORM (TypeScript-first, migration-ready)
- **CLI Framework**: Commander.js with inquirer prompts
- **API Framework**: Fastify with comprehensive plugin ecosystem
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod for schema validation and type safety
- **Testing**: Vitest framework with comprehensive coverage
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Documentation**: OpenAPI 3.0 with Swagger UI
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
# CLI Development
npm run dev          # Start CLI development with hot reload
npm run build        # Build TypeScript to JavaScript
npm run test         # Run test suite
npm run lint         # ESLint code checking
npm run type-check   # TypeScript type checking

# API Development
npm run api:dev      # Start API server in development mode
npm run api:build    # Build and start API server
npm run api:start    # Start production API server

# Database operations
npm run db:studio    # Open database browser
npm run db:generate  # Generate migrations
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
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

## REST API Usage

### Starting the API Server

```bash
# Development mode with hot reload
npm run api:dev

# Production mode
npm run build
npm run api:start
```

**API Server URLs:**
- **Base URL**: http://localhost:3000/api/v1/
- **Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### Authentication

```bash
# Login to get access token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@kpi.local", "password": "admin123"}'

# Use token in subsequent requests
curl -X GET http://localhost:3000/api/v1/staff \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Available API Endpoints

**🔐 Authentication:**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration (Admin only)
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile

**🏢 Department Management:**
- `GET /api/v1/departments` - List departments with pagination
- `GET /api/v1/departments/:id` - Get department details
- `POST /api/v1/departments` - Create department (Admin/Manager)
- `PUT /api/v1/departments/:id` - Update department (Admin/Manager)
- `DELETE /api/v1/departments/:id` - Delete department (Admin)

**👥 Staff Management:**
- `GET /api/v1/staff` - List staff with filtering & search
- `GET /api/v1/staff/:id` - Get staff member details
- `POST /api/v1/staff` - Create staff member (Admin/Manager)
- `PUT /api/v1/staff/:id` - Update staff member (Admin/Manager)
- `DELETE /api/v1/staff/:id` - Delete staff member (Admin)
- `PATCH /api/v1/staff/:id/activate` - Activate staff member
- `PATCH /api/v1/staff/:id/deactivate` - Deactivate staff member
- `GET /api/v1/staff/:id/performance` - Get staff performance data

**🔍 Advanced Features:**
- **Filtering**: `?departmentId=1&active=true&position=manager`
- **Search**: `?search=john` (searches name, email, employee ID)
- **Pagination**: `?page=1&limit=20`
- **Sorting**: `?sort=name&order=asc`

### Example API Usage

```bash
# Get all active staff in department 1
curl "http://localhost:3000/api/v1/staff?departmentId=1&active=true" \
  -H "Authorization: Bearer TOKEN"

# Search for staff by name
curl "http://localhost:3000/api/v1/staff?search=john" \
  -H "Authorization: Bearer TOKEN"

# Create new staff member
curl -X POST http://localhost:3000/api/v1/staff \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "name": "John Doe",
    "email": "john@company.com",
    "departmentId": 1,
    "position": "Developer"
  }'

# Get staff performance data
curl http://localhost:3000/api/v1/staff/1/performance \
  -H "Authorization: Bearer TOKEN"
```

## Database Schema

The system uses SQLite with the following core tables:

- **users**: User accounts for API authentication (Admin/Manager/Employee roles)
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
├── api/                # REST API Implementation
│   ├── controllers/    # API request handlers
│   ├── middleware/     # Authentication, error handling, validation
│   ├── routes/         # API route definitions with OpenAPI schemas
│   ├── schemas/        # Zod validation schemas for API requests
│   └── server.ts       # Fastify server configuration
├── cli/
│   ├── commands/       # CLI command handlers
│   ├── interactive.ts  # Interactive mode with full features
│   └── index.ts        # CLI entry point
├── core/
│   ├── services/       # Business logic (shared between CLI and API)
│   │   ├── AuthService.ts      # User authentication
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
├── types/              # TypeScript definitions (shared)
└── config/             # Configuration (CLI and API)
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

## API Implementation Status

### ✅ Completed REST API Features

The service layer architecture enabled **zero-duplication API implementation**:

**✅ Authentication & Security:**
- JWT-based authentication with access and refresh tokens
- Role-based authorization (Admin, Manager, Employee)
- bcrypt password hashing with secure session management
- Security middleware: Helmet, CORS, rate limiting

**✅ Department Management API:**
- Complete CRUD operations with proper authorization
- Pagination, filtering, and search capabilities
- Department statistics and staff listings
- Input validation and error handling

**✅ Staff Management API:**
- Full staff lifecycle management with department integration
- Advanced filtering (department, active status, position)
- Text search across name, email, employee ID
- Performance analytics and KPI tracking
- Activation/deactivation workflows

**✅ Infrastructure:**
- Fastify server with production-ready plugins
- OpenAPI 3.0 specification with interactive Swagger UI
- Comprehensive health monitoring and status endpoints
- Request/response validation using Zod schemas
- Standardized error responses with proper HTTP status codes

**🚧 Coming Next:**
- KPI Management API endpoints
- Data Entry & Evaluation API
- Reporting & Analytics API
- Advanced features and optimizations

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