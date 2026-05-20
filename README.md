# Haadthip Procurement Mockup

Next.js 16 procurement workflow mockup backed by Prisma and PostgreSQL.

## Local development

1. Copy `.env.example` to `.env` and fill in your local database values.
2. Start PostgreSQL.
3. Apply the schema with `npm run prisma:migrate:dev` or `npm run prisma:push`.
4. Optional: seed demo data with `npm run prisma:seed`.
5. Start the app with `npm run dev`.

## Environment variables

- `DATABASE_URL`: PostgreSQL connection string used by Prisma on the server.
- `NEXT_PUBLIC_APP_URL`: Public base URL used by the client.
- `SEED_ON_START`: Only used by `scripts/start-container.sh` for Docker-based startup.

Having both `.env` and `.env.example` is normal:

- `.env` is your real local configuration and should stay private.
- `.env.example` is a safe template for teammates and deployment setup.

## Prisma scripts

- `npm run prisma:generate`: Regenerate the Prisma client.
- `npm run prisma:migrate:dev`: Create or apply local development migrations.
- `npm run prisma:migrate:deploy`: Apply committed migrations to a deployed database.
- `npm run prisma:push`: Push the current schema without creating a migration.
- `npm run prisma:seed`: Seed demo data into a configured database.

## Deploying to Vercel

Vercel will build the Next.js app, but it will not run `scripts/start-container.sh`. That means Prisma schema setup and seeding need to happen through Prisma commands instead of container startup.

### Before the first deploy

1. Create a hosted PostgreSQL database.
2. Add `DATABASE_URL` and `NEXT_PUBLIC_APP_URL` in the Vercel project settings.
3. Keep `SEED_ON_START=false` for Vercel. It is not used there.
4. Apply the committed Prisma migration to the hosted database:

```bash
npm run prisma:migrate:deploy
```

5. If you want the demo records in that hosted database, run:

```bash
npm run prisma:seed
```

### Recommended Vercel settings

- Framework preset: `Next.js`
- Install command: `npm install`
- Build command: `npm run build`
- Output setting: leave default for Next.js

The `postinstall` script runs `prisma generate`, which helps ensure the Prisma client exists during Vercel builds.
