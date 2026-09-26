import { Module } from '@nestjs/common';
import { MandalPagesController } from './mandal-pages.controller';
import { MandalPagesService } from './mandal-pages.service';

@Module({
  controllers: [MandalPagesController],
  providers: [MandalPagesService],
  exports: [MandalPagesService],
})
export class MandalPagesModule {}
