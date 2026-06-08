import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnifeDiesController } from './knife_dies.controller';
import { KnifeDiesService } from './knife_dies.service';
import {KnifeDie} from '../entities/knife_dies';

@Module({
  imports: [TypeOrmModule.forFeature([KnifeDie])],
  controllers: [KnifeDiesController],
  providers: [KnifeDiesService],
  exports: [KnifeDiesService],
})
export class KnifeDiesModule {}
