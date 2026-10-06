# Campus Updates — Phase 1 structure

```text
campus-updates/
├── apps/
│   ├── api/                         # Express API and background-job hooks
│   │   ├── src/
│   │   │   ├── lib/                 # Prisma, auth, expiry, email, queues
│   │   │   ├── middleware/          # Authentication and role enforcement
│   │   │   ├── routes/               # Auth, users, categories, posts
│   │   │   ├── services/             # Business logic
│   │   │   ├── workers/              # BullMQ-ready worker entry points
│   │   │   └── server.ts
│   │   ├── prisma/seed.ts
│   │   └── tests/
│   └── web/                         # Next.js App Router PWA frontend
│       ├── app/                     # Login, dashboard, category, admin
│       ├── components/
│       └── lib/
├── prisma/schema.prisma             # Shared PostgreSQL data model
├── prisma/migrations/               # SQL migrations, including FTS index
└── docs/
```

## Phase 1 database decisions

- PostgreSQL stores all dates as `timestamptz` in UTC. The API formats dates in `Asia/Kolkata` for the UI.
- `User.active` deactivates an account without deleting it. `passwordHash` is nullable only until the first-login flow is completed.
- `Post.status` is a lifecycle field. Expiry is applied transactionally when posts are read or by the scheduler, and expired rows are never deleted.
- Deadline posts sort by `deadline_at`; notice posts sort by `created_at`. A configurable grace window lets students see unregistered expired deadline posts briefly.
- Audience fields are present in the schema now; Phase 1 uses `ALL` while the API is ready for later targeting.
- Search uses a PostgreSQL GIN index over title, summary, source, and link with `websearch_to_tsquery`, keeping search in the database rather than filtering in the browser.
