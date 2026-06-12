import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductsService } from './products.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  /**
   * 仓库扫码查询：按产品编码查询
   * GET /api/products/by-code/:code
   */
  @Get('by-code/:code')
  @Roles('boss', 'warehouse', 'sales')
  findByCode(@Param('code') code: string) {
    return this.service.findByCode(code);
  }

  /**
   * 模糊搜索
   * GET /api/products/search?q=xxx
   */
  @Get('search')
  @Roles('boss', 'warehouse', 'sales')
  search(@Query('q') q: string) {
    return this.service.search(q);
  }

  /**
   * 获取产品图片列表
   * GET /api/products/:id/images
   */
  @Get(':id/images')
  @Roles('boss', 'warehouse', 'sales')
  getImages(@Param('id', ParseIntPipe) id: number) {
    return this.service.getImages(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('boss', 'warehouse')
  create(@Body() body: any) {
    return this.service.create(body);
  }

  /**
   * 仓库入库/出库
   * POST /api/products/:id/stock
   */
  @Post(':id/stock')
  @Roles('boss', 'warehouse')
  updateStock(@Param('id', ParseIntPipe) id: number, @Body() body: { delta: number; type: 'in' | 'out' | 'set'; remark?: string }) {
    return this.service.updateStock(id, body);
  }

  /**
   * 添加产品图片（一张）
   * POST /api/products/:id/images
   */
  @Post(':id/images')
  @Roles('boss', 'warehouse')
  addImage(@Param('id', ParseIntPipe) id: number, @Body() body: { image_path: string; image_name: string; sort_order?: number }) {
    return this.service.addImage(id, body);
  }

  /**
   * 批量上传产品图片
   * POST /api/products/:id/images/batch
   */
  @Post(':id/images/batch')
  @Roles('boss', 'warehouse')
  batchAddImages(@Param('id', ParseIntPipe) id: number, @Body() body: { images: Array<{ image_path: string; image_name: string }> }) {
    return this.service.batchAddImages(id, body);
  }

  /**
   * 上传产品效果图（写入 option_image 字段）
   * POST /api/products/:id/option-image
   */
  @Post(':id/option-image')
  @Roles('boss', 'warehouse')
  uploadOptionImage(@Param('id', ParseIntPipe) id: number, @Body() body: { image_path: string }) {
    return this.service.uploadOptionImage(id, body);
  }

  /**
   * 上传刀模图（写入 knife_die 字段）
   * POST /api/products/:id/knife-die-image
   */
  @Post(':id/knife-die-image')
  @Roles('boss', 'warehouse')
  uploadKnifeDieImage(@Param('id', ParseIntPipe) id: number, @Body() body: { image_path: string }) {
    return this.service.uploadKnifeDieImage(id, body);
  }

  /**
   * 上传印版图（写入 print_plate 字段）
   * POST /api/products/:id/print-plate-image
   */
  @Post(':id/print-plate-image')
  @Roles('boss', 'warehouse')
  uploadPrintPlateImage(@Param('id', ParseIntPipe) id: number, @Body() body: { image_path: string }) {
    return this.service.uploadPrintPlateImage(id, body);
  }

  /**
   * 上传成品图（写入 finished_product_image 字段）
   * POST /api/products/:id/finished-product-image
   */
  @Post(':id/finished-product-image')
  @Roles('boss', 'warehouse')
  uploadFinishedProductImage(@Param('id', ParseIntPipe) id: number, @Body() body: { image_path: string }) {
    return this.service.uploadFinishedProductImage(id, body);
  }

  /**
   * 重排图片顺序
   * PUT /api/products/:id/images/order
   */
  @Put(':id/images/order')
  @Roles('boss', 'warehouse')
  reorderImages(@Param('id', ParseIntPipe) id: number, @Body() body: { image_ids: number[] }) {
    return this.service.reorderImages(id, body);
  }

  /**
   * 删除产品图片
   * DELETE /api/products/:id/images/:imageId
   */
  @Delete(':id/images/:imageId')
  @Roles('boss', 'warehouse')
  removeImage(@Param('id', ParseIntPipe) id: number, @Param('imageId', ParseIntPipe) imageId: number) {
    return this.service.removeImage(id, imageId);
  }

  @Put(':id')
  @Roles('boss', 'warehouse')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles('boss')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}