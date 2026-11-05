# FinanceAI database setup

The application uses the existing FinanceAI authentication session and a server-side MySQL database for financial data. Set these server-only values in `.env.local`:

```env
DB_HOST="localhost"
DB_PORT="3307"
DB_USER="root"
DB_PASSWORD="your-mysql-password"
DB_NAME="financeai"
```

Create the separate `financeai` database and tables with `database/schema.sql`. The schema does not drop or modify any other database. Then run:

```bash
npm install
npm run dev
```

Financial records are stored in MySQL tables and every API query is scoped by the verified `financeai_session` user ID. The browser never receives MySQL credentials.

## Database API routes

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|PUT /api/profile`
- `GET|POST /api/transactions`
- `PATCH|DELETE /api/transactions/:id`
- `GET /api/analysis`
- `POST /api/loans/analyze`

The main financial surfaces are `/expenses`, `/transactions`, dashboard analytics, tax assistant transaction loading, reports, and loan analysis saving.

## Project structure

This is a full-stack Next.js application. Frontend pages and backend API route handlers are intentionally organized under `app/`, following the Next.js App Router convention. Reusable UI is in `components/`, server-side business logic is in `lib/`, and MySQL setup files are in `database/`.

See [docs/PROJECT-STRUCTURE.md](docs/PROJECT-STRUCTURE.md) for the complete frontend, backend, database, and supporting-file layout.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
//"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -h 127.0.0.1 -P 3307 -p