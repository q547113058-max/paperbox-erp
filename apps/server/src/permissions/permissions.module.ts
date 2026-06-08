import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionController } from './permissions.controller';
import { PermissionService } from './permissions.service';
import { Permission } from '../entities/permissions';

@Module({
  imports: [TypeOrmModule.forFeature([Permission])],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
