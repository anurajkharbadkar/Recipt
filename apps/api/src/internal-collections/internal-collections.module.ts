import { Module } from '@nestjs/common';
import { InternalCollectionsController } from './internal-collections.controller';
import { InternalCollectionsService } from './internal-collections.service';

@Module({
  controllers: [InternalCollectionsController],
  providers: [InternalCollectionsService],
})
export class InternalCollectionsModule {}
