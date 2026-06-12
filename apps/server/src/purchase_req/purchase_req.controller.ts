import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PurchaseReqService } from './purchase_req.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('purchase-req')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseReqController {
  constructor(private readonly service: PurchaseReqService) {}

  /**
   * 从订单生成采购需求
   * POST /api/purchase-req/from-order/:orderId
   */
  @Post('from-order/:orderId')
  @Roles('boss', 'warehouse')
  fromOrder(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.service.fromOrder(orderId);
  }

  /**
   * 从工单生成采购需求
   * POST /api/purchase-req/from-workorder/:workOrderId
   */
  @Post('from-workorder/:workOrderId')
  @Roles('boss', 'warehouse')
  fromWorkOrder(@Param('workOrderId', ParseIntPipe) workOrderId: number) {
    return this.service.fromWorkOrder(workOrderId);
  }

  /**
   * 从产品列表生成采购需求
   * POST /api/purchase-req/from-products
   */
  @Post('from-products')
  @Roles('boss', 'warehouse')
  fromProducts(@Body() body: { products: Array<{ product_id: number; quantity: number }> }) {
    return this.service.fromProducts(body);
  }

  /**
   * 从采购需求创建采购单
   * POST /api/purchase-req/create-purchase
   */
  @Post('create-purchase')
  @Roles('boss', 'warehouse')
  createPurchase(@Body() body: any) {
    return this.service.createPurchase(body);
  }

  /**
   * 获取物料库存列表
   * GET /api/purchase-req/materials
   */
  @Get('materials')
  getMaterials() {
    return this.service.getMaterials();
  }

  /**
   * 物料入库
   * POST /api/purchase-req/materials/stock-in
   */
  @Post('materials/stock-in')
  @Roles('boss', 'warehouse')
  materialsStockIn(@Body() body: any) {
    return this.service.materialsStockIn(body);
  }
}
