# Campus Updates — Phase 1 MVP

Campus Updates turns a college’s scattered updates into a deadline-aware, mobile-first PWA. Phase 1 includes secure roll-number authentication, admin-managed student accounts and categories, manual post creation, PostgreSQL full-text search, auto-expiry, grace-window visibility, and the student dashboard.

## Folder structure and schema

The structure is documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). The complete PostgreSQL model is [`prisma/schema.prisma`](prisma/schema.prisma), with the initial SQL migration in `prisma/migrations/0001_init/migration.sql`.

Important Phase 1 tables:

- `User`: roll number login, bcrypt password hash, role, academic targeting fields, lockout counters, active/deactivated state, and session version.
- `Category`: ordered deadline or notice menu items.
- `Post`: deadline/notice content, source, optional official link/PDF URL, UTC timeline, pin/priority, audience fields, and lifecycle status.
- `Registration`, `Notification`, `NotificationRead`, `Reminder`, `AuditLog`, `PostHistory`, `AuthToken`: foundation tables for the later phases, already connected to `user_id` where applicable.

PostgreSQL has a GIN full-text index over title, summary, source, and link. The API searches it with `websearch_to_tsquery('simple', ...)`.

## Requirements

- Node.js 20+
- PostgreSQL 14+
- Redis 6+
- Optional S3-compatible storage (MinIO, AWS S3, Cloudflare R2, etc.) for PDF attachments

Docker is convenient, but the API and unit tests do not require Docker to be installed.

## Local setup

```bash
cp .env.example .env
# Change JWT_SECRET and ADMIN_PASSWORD in .env before using the app.

# If Docker is available:
docker compose up -d postgres redis minio

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seeded admin uses the values in `.env` (`ADMIN_ROLL_NO` and `ADMIN_PASSWORD`). A student account is created only by importing a CSV; there is no open signup.

### Student CSV

The admin page at `/admin/users` accepts a CSV with this header:

```csv
roll_no,name,email,year,branch,section
22CS001,Aarav Sharma,aarav@example.edu,2,CSE,A
22CS002,Meera Iyer,meera@example.edu,2,CSE,A
```

Imported users start without a password. They use **First login**, enter their roll number, receive a one-time email code, and set an 8+ character password. With `MOCK_EMAIL=true`, the code is logged by the API; development responses also expose it to make local setup easy. Production responses never expose credentials.

### PDF attachments

Phase 1 posts can link to an official PDF. An admin can also upload a PDF to `POST /api/posts/:id/pdf` as multipart field `file` once S3-compatible credentials are configured. Files are limited to 10 MB, restricted to `application/pdf`, stored under `posts/<post-id>/`, and uploaded with server-side AES256 encryption. The API never proxies or processes payment documents.

## Commands

```bash
npm run dev                         # API, expiry worker, and Next.js
npm run test                        # deadline/grace-window unit tests
npm run build                       # TypeScript API + production Next.js
npm run db:generate
npm run db:migrate
npm run db:seed
```

`npm run dev` starts the BullMQ expiry worker, which marks due deadline posts and notices past their optional validity date as `EXPIRED` every minute. Reads also run the expiry update so the behavior remains correct if a worker is temporarily unavailable.

## Phase 1 behavior

- Times are stored in UTC and rendered in IST (`Asia/Kolkata`). Admin datetime fields are labelled IST and converted explicitly before API submission.
- Deadline categories sort by nearest deadline; notice categories sort newest first. Expired rows remain in PostgreSQL and appear in the Past tab.
- Unregistered deadline items remain visible for `EXPIRY_GRACE_HOURS` after expiry (default `2.5`). A future registration status can remove a completed item from the active list.
- All admin routes enforce `ADMIN` on the server. UI hiding is not used as authorization.
- Login has an IP rate limit, a roll-number rate limit, bcrypt password verification, a five-failure 15-minute lockout, an expiring HTTP-only JWT cookie, logout session invalidation, and deactivated-account checks.
- State-changing browser requests validate the configured `Origin`; production requires HTTPS and a real email provider.

## Design decisions for later phases

- Prisma keeps the single shared PostgreSQL database easy to migrate while preserving explicit tables for registrations, notification read state, reminders, audits, and post history.
- BullMQ/Redis and the email provider are behind small service boundaries, so Phase 3 reminders can use the same scheduler with email and push channels.
- Raw WhatsApp files, AI import jobs, approval drafts, update suggestions, audience filters, bookmarks, calendar export, and analytics are deliberately Phase 2–4 work. They have schema space but do not bypass admin approval in this MVP.
