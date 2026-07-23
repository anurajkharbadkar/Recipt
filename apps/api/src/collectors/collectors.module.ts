import { Module } from '@nestjs/common';
import { CollectorsController } from './collectors.controller';
import { CollectorsService } from './collectors.service';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SmsModule],
  controllers: [CollectorsController],
  providers: [CollectorsService],
  exports: [CollectorsService],
})
export class CollectorsModule {}
