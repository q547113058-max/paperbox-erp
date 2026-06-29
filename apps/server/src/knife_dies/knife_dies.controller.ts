import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { KnifeDiesService } from './knife_dies.service';
import { KnifeDie } from '../entities/knife_dies';

@Controller('knife_dies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KnifeDiesController extends CrudController<KnifeDie> {
  constructor(service: KnifeDiesService) {
    super(service);
  }
}
