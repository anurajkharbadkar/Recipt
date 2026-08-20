# Project Rules & Guidelines

## Database & Migration Safeguards (Strict)
1. **Never Run Migrations Automatically**: Do NOT execute any database migrations (`prisma migrate dev`, `prisma db push`, `npx prisma migrate deploy`, or table alteration scripts) unless the user explicitly requests or confirms it.
2. **Zero Data Loss**: Whenever a migration is explicitly requested by the user, ensure it is non-destructive and that all existing production data (Mandals, receipts, donors, users, expenses) is fully preserved without data loss or downtime.
