# FinanceAI Project Structure

FinanceAI is a full-stack Next.js application. Next.js intentionally keeps frontend routes and backend route handlers under the `app/` directory, so the project should not be split into separate frontend and backend projects.

```text
FinanceAI/
├── app/                         # Frontend pages and Next.js route handlers
│   ├── api/                     # Backend HTTP APIs
│   │   ├── auth/                # Registration, login, logout, session, OTP
│   │   ├── ai/                  # Gemini Finance AI endpoint
│   │   ├── reports/             # Authenticated financial report endpoint
│   │   ├── transactions/        # Transaction APIs
│   │   ├── expenses/            # Expense APIs
│   │   ├── profile/             # Financial profile API
│   │   ├── loans/               # Loan analysis API
│   │   ├── dashboard/           # Dashboard data API
│   │   └── analysis/            # Financial analysis API
│   ├── accounts/                # Account pages
│   ├── dashboard/               # Dashboard page
│   ├── reports/                 # Financial report page
│   ├── transactions/            # Transaction pages
│   ├── tax-assistant/           # Tax pages
│   ├── loan-assistant/          # Loan pages
│   ├── globals.css              # Global and print styling
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                  # Reusable React UI components
│   ├── auth/                    # Authentication components
│   ├── layout/                  # Navigation and dashboard layout
│   ├── accounts/                # Account components
│   ├── transactions/            # Transaction components
│   ├── loan/                    # Loan result components
│   ├── tax/                     # Tax components
│   ├── ai/                      # AI chat and insight components
│   └── ui/                      # Shared UI primitives
├── lib/                         # Server utilities and business logic
│   ├── db/                      # MySQL connection and finance queries
│   ├── finance/                 # Category colors and expense-period helpers
│   ├── tax/                     # Tax rules and calculator
│   ├── server-auth.ts           # financeai_session authentication
│   ├── auth-store.ts            # User authentication database operations
│   └── api-response.ts          # Shared API error responses
├── database/                    # MySQL setup and schema files
│   ├── schema.sql               # Database tables and indexes
│   ├── reset-financeai.sql      # Development reset script
│   └── FinanceAI-my.ini         # Local MySQL configuration
├── public/                      # Static assets
├── docs/                        # Project documentation
├── package.json                 # Dependencies and scripts
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── eslint.config.mjs            # ESLint configuration
└── .env.local                  # Local secrets and database settings (not committed)
```

## Active technology boundaries

- **Frontend:** React components and pages in `app/` and `components/`.
- **Backend:** Node.js runtime through Next.js Route Handlers in `app/api/`, supported by server utilities in `lib/`.
- **Database:** MySQL `financeai`, accessed through `mysql2` in `lib/db/mysql.ts`.
- **Authentication:** Custom `financeai_session` HTTP-only JWT cookie using `jose`; user records are stored in MySQL.
- **Unused tooling:** `prisma/` is not referenced by the current application. The unused Supabase starter-assets folder was removed; the application uses MySQL.
