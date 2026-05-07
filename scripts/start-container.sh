#!/bin/sh
set -eu

echo "Applying Prisma schema..."
npx prisma db push

if [ "${SEED_ON_START:-true}" = "true" ]; then
  echo "Seeding demo data..."
  npm run prisma:seed
fi

echo "Starting Next.js standalone server..."
node server.js
