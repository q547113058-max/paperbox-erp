import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CrudController } from '../common/crud.controller';
import { PrintItemImageService } from './print_item_images.service';
import { PrintItemImage } from '../entities/print_item_images';

@Controller('print_item_images')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrintItemImageController extends CrudController<PrintItemImage> {
  constructor(service: PrintItemImageService) {
    super(service);
  }
}
