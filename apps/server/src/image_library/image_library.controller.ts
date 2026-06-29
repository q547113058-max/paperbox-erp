import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ImageLibraryService } from './image_library.service';

@Controller('image-library')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImageLibraryController {
  constructor(private readonly service: ImageLibraryService) {}

  /**
   * 刀模图片库：按图片分组，返回使用该图片的产品
   * GET /api/image-library/knife-dies
   */
  @Get('knife-dies')
  @Roles('boss', 'sales', 'warehouse', 'production')
  getKnifeDieImages() {
    return this.service.getKnifeDieImages();
  }

  /**
   * 彩印图片库：按图片分组，返回使用该图片的产品
   * GET /api/image-library/print-plates
   */
  @Get('print-plates')
  @Roles('boss', 'sales', 'warehouse', 'production')
  getPrintPlateImages() {
    return this.service.getPrintPlateImages();
  }
}
