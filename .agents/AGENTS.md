# Project Rules & Guidelines

## Database & Migration Safeguards (Strict)
1. **Never Run Migrations Automatically**: Do NOT execute any database migrations (`prisma migrate dev`, `prisma db push`, `npx prisma migrate deploy`, or table alteration scripts) unless the user explicitly requests or confirms it.
2. **Zero Data Loss**: Whenever a migration is explicitly requested by the user, ensure it is non-destructive and that all existing production data (Mandals, receipts, donors, users, expenses) is fully preserved without data loss or downtime.

## Coding Standards & Quality Guidelines (Strict)
1. **Industry-Standard Practices**: Always follow production-grade, industry-specific coding standards, TypeScript/React/NestJS best practices, strict type safety, proper architectural separation, and clean maintainable code principles.
2. **No Temporary Patches or Quick Fixes**: Never apply band-aids, hacky workarounds, silent exception swallowing, dummy fallbacks, or temporary fixes. All code modifications must address root causes cleanly, robustly, and permanently.

