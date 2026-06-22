# Pest Control ERP — Product Requirements (PRD)

## Original Problem Statement
Build a production-ready Pest Control ERP + CRM + Technician App for a UAE-based pest control company with 12 technicians. Responsive (Desktop / Tablet / Mobile / PWA). 14 modules: Dashboard, CRM, Leads, Quotations, AMC, Jobs, Scheduling, Technician App, Service Reports, Finance, Invoices, Inventory, Reporting, Investment Tracker. 5 roles: Super Admin, Operations Manager, Sales, Accountant, Technician. AI assistant for predictions/forecasts/messaging. Modern UI, dark-mode ready, English (Arabic-ready).

## Stack & Decisions
- **Database**: MongoDB (NoSQL — replaces requested Postgres for faster delivery on this platform)
- **Backend**: FastAPI + Motor + JWT auth + RBAC, all routes `/api/*`
- **Frontend**: React 19, Tailwind, shadcn/ui, Recharts, lucide-react
- **AI**: Claude Sonnet 4.5 via emergentintegrations (Emergent LLM key)
- **PDFs**: client-side `window.print()` from styled HTML (download-only for MVP)
- **Auth**: JWT + bcrypt + role-based route guards

## Roles & Permissions
- `super_admin` — full access incl. audit logs, user creation
- `ops_manager` — scheduling, jobs, customers, AMC, service reports
- `sales` — leads, quotations, customers, invoices
- `accountant` — invoices, finance, expenses, investments
- `technician` — own jobs only, mobile app, photo/sig capture

## Test Credentials
See `/app/memory/test_credentials.md`

## Implemented (Phase 1 — Feb 2026)
- ✅ JWT auth + 5-role RBAC + audit logs
- ✅ Dashboard (11 KPIs + 5 charts: revenue trend, jobs by service, lead funnel, tech performance, AMC trend)
- ✅ Customers CRM (list, search, create, profile with tabs)
- ✅ Lead pipeline Kanban (drag & drop across 8 stages)
- ✅ AMC contracts (renewal alerts, visits tracking)
- ✅ Jobs (create, assign technician, status flow)
- ✅ Weekly drag-and-drop schedule (job rescheduling, technician reassignment)
- ✅ Technician mobile app (today's jobs, GPS check-in/out, before/after photos, signature canvas, complete-and-generate-report)
- ✅ Service Reports with auto-PDF (browser print)
- ✅ Quotations with PDF
- ✅ Invoices with VAT (5%), status flow, PDF
- ✅ Finance: expenses CRUD, P&L summary, expense by category chart
- ✅ Inventory: chemicals, low-stock + expiry alerts
- ✅ Investment Tracker: MF/ETF/Stocks, allocation pie, 1/3/5/10y projections
- ✅ AI Assistant chat (Claude Sonnet 4.5) with business context awareness
- ✅ PWA manifest, mobile-responsive layouts
- ✅ Seed data: 4 staff + 12 technicians + 15 customers + 18 leads + 10 AMCs + 40 jobs + 25 invoices + expenses + inventory

## Deferred / P1 backlog (Phase 2)
- Email + WhatsApp sharing for quotes/invoices (SendGrid / Twilio)
- Server-side PDF rendering (pdfkit / reportlab) for archival
- File/photo object storage (currently base64 in DB)
- Excel report exports
- Arabic translation (i18n) and full RTL
- Streaming AI responses via SSE
- Detailed reports module (custom date range + export)
- Audit log viewer UI (data exists in DB)
- Service-worker / offline PWA caching
- Password reset flow

## Architecture
Designed for additive scaling — adding new modules requires only:
1. Pydantic model + collection in `server.py`
2. CRUD router using the existing helpers
3. Frontend page + nav entry in `Layout.jsx`

No schema migrations needed (MongoDB is schemaless), foreign keys are by string `id` references.
