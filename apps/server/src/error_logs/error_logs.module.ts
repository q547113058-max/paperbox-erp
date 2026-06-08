import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorLogController } from './error_logs.controller';
import { ErrorLogService } from './error_logs.service';
import { ErrorLog } from '../entities/error_logs';

@Module({
  imports: [TypeOrmModule.forFeature([ErrorLog])],
  controllers: [ErrorLogController],
  providers: [ErrorLogService],
  exports: [ErrorLogService],
})
export class ErrorLogModule {}
