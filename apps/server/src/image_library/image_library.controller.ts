import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ImageLibraryService } from './image_library.service';

@Controller('image-library')
@UseGuards(JwtAuthGuard)
export class ImageLibraryController {
  constructor(private readonly service: ImageLibraryService) {}

  /**
   * 刀模图片库：按图片分组，返回使用该图片的产品
   * GET /api/image-library/knife-dies
   */
  @Get('knife-dies')
  getKnifeDieImages() {
    return this.service.getKnifeDieImages();
  }

  /**
   * 彩印图片库：按图片分组，返回使用该图片的产品
   * GET /api/image-library/print-plates
   */
  @Get('print-plates')
  getPrintPlateImages() {
    return this.service.getPrintPlateImages();
  }
}
