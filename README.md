# Chimu Alert (okuyami-alert)

Early MVP for the obituary candidate notification app described in `AGENT.md`.

## Tech Stack
- Next.js 15 / App Router + TypeScript
- Prisma ORM targeting PostgreSQL (`DATABASE_URL`)
- Tailwind CSS 4 (postcss preset)

## Getting Started
1. `npm install`
2. Copy `.env.example` to `.env.local` and provide values (PostgreSQL connection required).
3. Set `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`) and other auth-related variables in `.env.local`.
4. Apply the initial Prisma migration: `npm run prisma:migrate`
5. Generate the Prisma client: `npm run prisma:generate`
6. Start the dev server with `npm run dev`

> Tip: when working locally, `docker compose up` with a simple Postgres image or a managed service such as Supabase/Neon works well.

## Database overview
- `User`: application users (NextAuth compatible) with `role` for admin gates.
- `Name`: names a user monitors, with normalized cache columns.
- `Obituary`: ingested obituary records and related metadata.
- `Notification`: join table between users, tracked names, and obituaries for delivery history.
- `NotificationPreference`: per-user notification frequency (instant / daily digest).
- NextAuth support tables: `Account`, `Session`, `VerificationToken`, `Authenticator`.

## Authentication
- Email/Password authentication uses NextAuth Credentials provider backed by Prisma.
- `/app/login` handles both registration and login; authenticated users are redirected to `/app/dashboard`.
- `/app/*` routes are protected by middleware and require a valid session.
- Required env vars: `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `EMAIL_FROM`, and one of `RESEND_API_KEY` / `SENDGRID_API_KEY`.
- `/app/names` lets users manage monitored names (CRUD + ON/OFF).

Refer to `prisma/schema.prisma` and the generated migration for the canonical definition.
