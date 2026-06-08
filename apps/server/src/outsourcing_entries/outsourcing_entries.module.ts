import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutsourcingEntryController } from './outsourcing_entries.controller';
import { OutsourcingEntryService } from './outsourcing_entries.service';
import { OutsourcingEntry } from '../entities/outsourcing_entries';

@Module({
  imports: [TypeOrmModule.forFeature([OutsourcingEntry])],
  controllers: [OutsourcingEntryController],
  providers: [OutsourcingEntryService],
  exports: [OutsourcingEntryService],
})
export class OutsourcingEntryModule {}
