# CLAUDE.md

**Project:** AVD Template Management Portal
**Version:** 1.0.0
**Last Updated:** 2025-12-15
**Platform:** Windows 11 (WSL available)

---

## CRITICAL: Process Protection Rules

### NEVER TERMINATE CLAUDE'S PROCESS

**MANDATORY:** Before terminating ANY node.exe process, you MUST verify it is NOT Claude Code.

```powershell
# ALWAYS check before killing any node process
Get-Process -Name node | Select-Object Id, ProcessName, CommandLine

# Or with wmic:
wmic process where "name='node.exe'" get processid,commandline

# NEVER run blanket kills like:
# taskkill /F /IM node.exe          # DANGEROUS - WILL KILL CLAUDE
# Get-Process node | Stop-Process   # DANGEROUS - WILL KILL CLAUDE

# SAFE: Kill specific PID after verifying it's NOT Claude
# taskkill /F /PID <specific_pid>   # Only after verification
```

**Safe Process Termination Checklist:**
1. List all node processes with their command lines
2. Identify which PIDs belong to AVDManager (api/web dev servers)
3. Verify the PID is NOT running `claude` in its command line
4. Only then terminate the specific PID

---

## Project Overview

AVD Template Management Portal - A full-stack application for organizing and managing Azure Virtual Desktop host pool templates.

### Features
- Template CRUD with status workflow (Draft -> In Review -> Approved -> Deployed -> Deprecated)
- Application management with MSIX App Attach support
- Business unit and contact management
- Full audit logging
- JWT authentication

---

## Tech Stack

**Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
**Backend:** Fastify 5 + TypeScript + Prisma
**Database:** PostgreSQL 16 (Docker)
**Package Manager:** pnpm + Turborepo

---

## Project Structure

```
AVDManager/
├── apps/
│   ├── api/              # Fastify backend (port 4010)
│   │   └── src/
│   │       ├── routes/   # API endpoints
│   │       ├── services/ # Business logic
│   │       ├── middleware/
│   │       └── utils/
│   └── web/              # React frontend (port 5173)
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── services/
│           ├── stores/
│           └── hooks/
├── packages/
│   └── shared/           # Shared types/utilities
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Migration files
│   └── seed.ts           # Demo data
├── docker-compose.yml    # PostgreSQL container
└── turbo.json           # Turborepo config
```

---

## Development Setup

### Prerequisites
- Node.js >= 20
- pnpm 9.x
- Docker Desktop

### Quick Start

```powershell
# 1. Start PostgreSQL container
docker-compose up -d

# 2. Install dependencies
pnpm install

# 3. Run database migrations
pnpm db:generate
pnpm db:migrate

# 4. Seed database with demo data
pnpm db:seed

# 5. Start development servers
pnpm dev
```

### Ports
- **API:** http://localhost:4010
- **Web:** http://localhost:5173
- **PostgreSQL:** localhost:5433

### Default Login
- Email: admin@avdmanager.local
- Password: admin123

---

## Available Scripts

```powershell
# Development
pnpm dev              # Start all services (API + Web)
pnpm db:studio        # Open Prisma Studio

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database (destructive!)

# Docker
pnpm docker:dev       # Start PostgreSQL container
pnpm docker:down      # Stop PostgreSQL container

# Build & Quality
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm test             # Run tests
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Templates
- `GET /api/templates` - List templates (with filtering)
- `GET /api/templates/:id` - Get template details
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `GET /api/templates/:id/history` - Get template history

### Applications
- `GET /api/applications` - List applications
- `POST /api/applications` - Create application
- `PUT /api/applications/:id` - Update application
- `DELETE /api/applications/:id` - Delete application

### Business Units
- `GET /api/business-units` - List business units
- `POST /api/business-units` - Create business unit
- `PUT /api/business-units/:id` - Update business unit
- `DELETE /api/business-units/:id` - Delete business unit

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

### Audit
- `GET /api/audit` - Get audit logs

---

## Database Schema (Key Entities)

### Template
Main entity for AVD host pool templates with:
- Status workflow
- Business unit association
- Contact information
- Host pool configuration
- Azure resource IDs
- Application associations

### Application
Software applications with MSIX App Attach support and licensing information.

### BusinessUnit
Organizational units (departments or vendors) that own templates.

### Contact
Points of contact for business units and templates.

### AuditLog
Comprehensive audit trail for all changes.

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Use interfaces for data structures
- No `any` types without justification

### React
- Functional components with hooks
- Use Zustand for state management
- TanStack Query for server state

### API
- RESTful conventions
- Zod for validation
- Consistent error responses

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://avdmanager:avdmanager@localhost:5433/avdmanager"

# JWT
JWT_SECRET="dev-jwt-secret-change-in-production"

# API
API_PORT=4010
API_HOST=0.0.0.0

# Frontend
VITE_API_URL=http://localhost:4010
```

---

## Troubleshooting

### Port Already in Use

```powershell
# Find process on port (SAFE - just viewing)
netstat -ano | findstr :4010

# Check what's using node (ALWAYS do this before killing)
wmic process where "name='node.exe'" get processid,commandline

# Kill SPECIFIC PID only after verifying it's NOT Claude
taskkill /F /PID <verified_pid>
```

### Database Connection Failed
```powershell
# Check Docker container status
docker ps

# Restart PostgreSQL container
docker-compose down
docker-compose up -d
```

### Prisma Issues
```powershell
# Regenerate client
pnpm db:generate

# Reset database (DESTRUCTIVE - development only!)
pnpm db:reset
```

---

## Recent Changes (Git Log)

1. **fix: properly unwrap API responses** - Fixed service methods to correctly extract data from API responses
2. **fix: handle null entityType in dashboard** - Fixed null handling in recent activity display
3. **feat: enhance template filtering** - Added advanced filtering capabilities to templates list
4. **feat: add template history/journal tracking UI** - Added history view for template changes
5. **Initial commit** - AVD Template Management Portal scaffolding

---

## AI Agent Instructions

### ALWAYS
1. Read CLAUDE.md before making changes
2. Check process list before killing ANY node process
3. Use environment variables for configuration
4. Write tests for new features
5. Follow TypeScript strict mode

### NEVER
1. **NEVER terminate node.exe without checking if it's Claude first**
2. Never commit secrets to git
3. Never use mock data in source code
4. Never skip input validation
5. Never ignore TypeScript errors
