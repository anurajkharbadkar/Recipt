import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { StorageModule } from '../storage/storage.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [StorageModule, WhatsappModule, SmsModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
