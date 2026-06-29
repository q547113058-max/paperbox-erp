import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Material } from '../entities/materials';
import { Product } from '../entities/products';
import { Order } from '../entities/orders';
import { OrderItem } from '../entities/order_items';
import { WorkOrder } from '../entities/work_orders';
import { Purchase } from '../entities/purchases';
import { PurchaseItem } from '../entities/purchase_items';
import { FinanceRecord } from '../entities/finance_records';
import { Supplier } from '../entities/suppliers';

@Injectable()
export class PurchaseReqService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepo: Repository<Material>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(WorkOrder)
    private readonly workOrderRepo: Repository<WorkOrder>,
    @InjectRepository(Purchase)
    private readonly purchaseRepo: Repository<Purchase>,
    @InjectRepository(PurchaseItem)
    private readonly purchaseItemRepo: Repository<PurchaseItem>,
    @InjectRepository(FinanceRecord)
    private readonly financeRepo: Repository<FinanceRecord>,
    @InjectRepository(Supplier)
    private readonly supplierRepo: Repository<Supplier>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 简易 BOM 物料需求计算
   * 根据产品的面纸/坑纸/楞纸等属性生成物料需求
   */
  private calculateMaterialNeeds(product: any, quantity: number) {
    const needs: Array<{ name: string; spec: string; unit: string; quantity: number }> = [];

    // 面纸需求
    if (product.face_paper) {
      const area = (product.length || 0) * (product.width || 0) * quantity / 1000000;
      needs.push({ name: '面纸', spec: product.face_paper, unit: '平方米', quantity: Math.ceil(area * 1.1 * 100) / 100 });
    }
    // 坑纸/瓦楞纸需求
    if (product.corrugated_paper) {
      const area = (product.length || 0) * (product.width || 0) * quantity / 1000000;
      needs.push({ name: '坑纸', spec: product.corrugated_paper, unit: '平方米', quantity: Math.ceil(area * 1.05 * 100) / 100 });
    }
    // 其他物料（从 material_type 推断）
    if (product.material && !product.face_paper && !product.corrugated_paper) {
      needs.push({ name: '纸板', spec: product.material, unit: '张', quantity: quantity });
    }

    return needs;
  }

  /**
   * 查询物料库存并计算实际采购需求
   */
  private async calculateActualNeeds(needs: Array<{ name: string; spec: string; unit: string; quantity: number }>) {
    const results = [];
    for (const need of needs) {
      const stock = await this.materialRepo
        .createQueryBuilder('m')
        .select('COALESCE(SUM(m.quantity), 0)', 'stock')
        .where('m.name = :name', { name: need.name })
        .andWhere('m.spec = :spec', { spec: need.spec || '' })
        .getRawOne();

      const currentStock = Number(stock?.stock) || 0;
      const actualNeed = Math.max(0, need.quantity - currentStock);

      results.push({
        name: need.name,
        spec: need.spec,
        unit: need.unit,
        requiredQty: need.quantity,
        currentStock,
        actualNeed: Math.ceil(actualNeed * 100) / 100,
      });
    }
    return results.filter(r => r.actualNeed > 0);
  }

  /**
   * 从订单生成采购需求
   * POST /api/purchase-req/from-order/:orderId
   */
  async fromOrder(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('订单不存在');

    const items = await this.orderItemRepo.find({ where: { order_id: orderId } });
    const allNeeds: Array<{ name: string; spec: string; unit: string; quantity: number }> = [];

    // Preload products to avoid N+1
    const productIds = [...new Set(items.map((item: any) => item.product_id).filter(Boolean))];
    const products = await this.productRepo.find({ where: productIds.length > 0 ? { id: { $in: productIds } as any } : {} });
    const productMap = new Map<number, Product>();
    for (const p of products) {
      productMap.set(p.id, p);
    }

    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) continue;
      const needs = this.calculateMaterialNeeds(product, item.quantity || 0);
      allNeeds.push(...needs);
    }

    // 合并同类物料
    const merged = this.mergeNeeds(allNeeds);
    const purchaseItems = await this.calculateActualNeeds(merged);

    const customer = order.customer_id ? await this.supplierRepo.findOne({ where: { id: order.customer_id } }) : null;

    return {
      order_id: orderId,
      order_no: order.order_no,
      customer: customer?.name || '',
      requirements: purchaseItems,
      totalItems: purchaseItems.length,
    };
  }

  /**
   * 从工单生成采购需求
   * POST /api/purchase-req/from-workorder/:workOrderId
   */
  async fromWorkOrder(workOrderId: number) {
    const wo = await this.workOrderRepo.findOne({ where: { id: workOrderId } });
    if (!wo) throw new NotFoundException('工单不存在');

    const materials = JSON.parse(wo.materials_json || '[]');
    const needs = materials.map((m: any) => ({
      name: m.name || m.material_name,
      spec: m.spec || m.material_spec || '',
      unit: m.unit || '',
      quantity: m.quantity || 0,
    }));

    const purchaseItems = await this.calculateActualNeeds(needs);

    return {
      work_order_id: workOrderId,
      prod_no: wo.prod_no,
      product_id: wo.product_id,
      quantity: wo.quantity,
      requirements: purchaseItems,
    };
  }

  /**
   * 从产品列表生成采购需求
   * POST /api/purchase-req/from-products
   */
  async fromProducts(data: { products: Array<{ product_id: number; quantity: number }> }) {
    const { products } = data;
    if (!products || products.length === 0) throw new BadRequestException('产品列表不能为空');

    const allNeeds: Array<{ name: string; spec: string; unit: string; quantity: number }> = [];
    const sourceProducts: any[] = [];

    // Preload products to avoid N+1
    const productIds = [...new Set(products.map((p: any) => p.product_id).filter(Boolean))];
    const productList = await this.productRepo.find({ where: productIds.length > 0 ? { id: { $in: productIds } as any } : {} });
    const productMap = new Map<number, Product>();
    for (const p of productList) {
      productMap.set(p.id, p);
    }

    for (const { product_id, quantity } of products) {
      const product = productMap.get(product_id);
      if (!product) continue;
      const needs = this.calculateMaterialNeeds(product, quantity);
      allNeeds.push(...needs);
      sourceProducts.push({
        code: product.code,
        name: product.name,
        spec: product.finished_spec || `${product.length}×${product.width}×${product.height}`,
        quantity,
      });
    }

    const merged = this.mergeNeeds(allNeeds);
    const purchaseItems = await this.calculateActualNeeds(merged);

    return {
      requirements: purchaseItems.length > 0 ? purchaseItems : merged.map(n => ({ ...n, currentStock: 0, actualNeed: n.quantity, requiredQty: n.quantity })),
      totalItems: purchaseItems.length,
      sourceProducts,
    };
  }

  /**
   * 从采购需求创建采购单
   * POST /api/purchase-req/create-purchase
   */
  async createPurchase(data: {
    supplier_id: number;
    delivery_date?: string;
    remark?: string;
    items: Array<{ name: string; spec: string; actualNeed: number; unit_price?: number; relatedProducts?: any[] }>;
    ref_type?: string;
    ref_id?: number;
  }) {
    const { supplier_id, delivery_date, remark, items, ref_type, ref_id } = data;
    if (!items || items.length === 0) throw new BadRequestException('采购明细不能为空');

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const purchaseNo = `PO${Date.now()}`;

      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += (item.actualNeed || 0) * (item.unit_price || 0);
      });

      const purchase = manager.create(Purchase, {
        purchase_no: purchaseNo,
        supplier_id,
        status: '待审批',
        total_amount: totalAmount,
        delivery_date: delivery_date || '',
        remark: remark || '',
        created_at: now,
        ref_type: ref_type || '',
        ref_id: ref_id || 0,
        work_order_id: 0,
        delivery_address: '',
      });
      const saved = await manager.save(purchase);

      for (const item of items) {
        const pi = manager.create(PurchaseItem, {
          purchase_id: saved.id,
          material_name: item.name,
          spec: item.spec || '',
          quantity: item.actualNeed || 0,
          unit_price: item.unit_price || 0,
          amount: (item.actualNeed || 0) * (item.unit_price || 0),
          ref_info: JSON.stringify(item.relatedProducts || []),
          paper_type: '',
          unit: '',
          delivery_address: '',
        });
        await manager.save(pi);
      }

      // 创建财务应付记录
      const supplier = await manager.findOne(Supplier, { where: { id: supplier_id } });
      const finance = manager.create(FinanceRecord, {
        type: '应付',
        ref_no: purchaseNo,
        ref_type: '采购单',
        party_name: supplier?.name || '',
        amount: totalAmount,
        status: '未结清',
        due_date: delivery_date || '',
        created_at: now,
        paid_at: '',
        period_type: '',
        category: '',
        description: '',
        canceled_at: '',
        canceled_reason: '',
        canceled_by: '',
      });
      await manager.save(finance);

      return { success: true, purchase_id: saved.id, purchase_no: purchaseNo, total_amount: totalAmount, item_count: items.length };
    });
  }

  /**
   * 获取物料库存列表
   * GET /api/purchase-req/materials
   */
  async getMaterials() {
    return this.materialRepo.find({ order: { name: 'ASC', spec: 'ASC' } });
  }

  /**
   * 物料入库（加权平均价）
   * POST /api/purchase-req/materials/stock-in
   */
  async materialsStockIn(data: { name: string; spec?: string; quantity: number; unit?: string; unit_price?: number; supplier_id?: number }) {
    const { name, spec, quantity, unit, unit_price, supplier_id } = data;
    if (!name || !quantity) throw new BadRequestException('物料名和数量不能为空');

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const existing = await this.materialRepo.findOne({ where: { name, spec: spec || '' } });

    if (existing) {
      // 加权平均价更新
      const oldQty = existing.quantity || 0;
      const oldPrice = existing.avg_price || 0;
      const newQty = oldQty + quantity;
      existing.quantity = newQty;
      if (unit_price && newQty > 0) {
        existing.avg_price = Math.round(((oldPrice * oldQty + unit_price * quantity) / newQty) * 100) / 100;
      }
      await this.materialRepo.save(existing);
    } else {
      const mat = this.materialRepo.create({
        name,
        spec: spec || '',
        unit: unit || '',
        quantity,
        avg_price: unit_price || 0,
        safety_stock: 0,
        supplier_id: supplier_id || 0,
        created_at: now,
        material_type: '外购件',
      });
      await this.materialRepo.save(mat);
    }

    return { success: true };
  }

  // ========== 工具方法 ==========

  private mergeNeeds(needs: Array<{ name: string; spec: string; unit: string; quantity: number }>) {
    const map = new Map<string, { name: string; spec: string; unit: string; quantity: number }>();
    for (const n of needs) {
      const key = `${n.name}|${n.spec}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += n.quantity;
      } else {
        map.set(key, { ...n });
      }
    }
    return Array.from(map.values());
  }
}
