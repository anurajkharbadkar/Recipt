import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { StorageModule } from '../storage/storage.module';
import { PdfModule } from '../pdf/pdf.module';

@Module({
  imports: [StorageModule, PdfModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
