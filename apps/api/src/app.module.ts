import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { ReceiptsModule } from './receipts/receipts.module';
import { CollectorsModule } from './collectors/collectors.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ReportsModule } from './reports/reports.module';
import { PdfModule } from './pdf/pdf.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { SmsModule } from './sms/sms.module';
import { StorageModule } from './storage/storage.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
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
    WhatsappModule,
    SmsModule,
    StorageModule,
    PermissionsModule,
  ],
})
export class AppModule {}
