import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecOptionsController } from './spec_options.controller';
import { SpecOptionsService } from './spec_options.service';
import {SpecOption} from '../entities/spec_options';

@Module({
  imports: [TypeOrmModule.forFeature([SpecOption])],
  controllers: [SpecOptionsController],
  providers: [SpecOptionsService],
  exports: [SpecOptionsService],
})
export class SpecOptionsModule {}
