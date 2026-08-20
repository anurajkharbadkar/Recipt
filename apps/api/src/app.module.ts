import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { CollectorsModule } from './collectors/collectors.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { PdfModule } from './pdf/pdf.module';
import { StorageModule } from './storage/storage.module';
import { MembersModule } from './members/members.module';
import { InternalCollectionsModule } from './internal-collections/internal-collections.module';
import { PaymentsModule } from './payments/payments.module';
import { CashfreeModule } from './payments/cashfree/cashfree.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', 'apps/api/.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 1000 },
    ]),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    CampaignsModule,
    ReceiptsModule,
    CollectorsModule,
    ExpensesModule,
    ReportsModule,
    PdfModule,
    StorageModule,
    MembersModule,
    InternalCollectionsModule,
    PaymentsModule,
    CashfreeModule,
  ],
  providers: [
    // Applies the ThrottlerModule limits above to every route by default
    // (brute-force protection on login in particular). Was configured but
    // never bound — see production_readiness_report.md.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
