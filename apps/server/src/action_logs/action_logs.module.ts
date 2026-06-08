import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionLogController } from './action_logs.controller';
import { ActionLogService } from './action_logs.service';
import { ActionLog } from '../entities/action_logs';

@Module({
  imports: [TypeOrmModule.forFeature([ActionLog])],
  controllers: [ActionLogController],
  providers: [ActionLogService],
  exports: [ActionLogService],
})
export class ActionLogModule {}
