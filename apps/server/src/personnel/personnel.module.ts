import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonnelController } from './personnel.controller';
import { PersonnelService } from './personnel.service';
import {Personnel} from '../entities/personnel';

@Module({
  imports: [TypeOrmModule.forFeature([Personnel])],
  controllers: [PersonnelController],
  providers: [PersonnelService],
  exports: [PersonnelService],
})
export class PersonnelModule {}
