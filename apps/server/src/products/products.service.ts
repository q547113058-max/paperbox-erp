import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from '../entities/products';
import { PrintItem } from '../entities/print_items';
import { PrintItemImage } from '../entities/print_item_images';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
    @InjectRepository(PrintItem)
    private readonly printItemRepo: Repository<PrintItem>,
    @InjectRepository(PrintItemImage)
    private readonly printImageRepo: Repository<PrintItemImage>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findByCode(code: string) {
    const p = await this.repo.findOne({ where: { code } });
    if (!p) throw new NotFoundException(`编码 ${code} 不存在`);
    return p;
  }

  async search(q: string) {
    if (!q) return this.findAll();
    return this.repo
      .createQueryBuilder('p')
      .where('p.code LIKE :q OR p.name LIKE :q OR p.spec LIKE :q', { q: `%${q}%` })
      .orderBy('p.id', 'DESC')
      .limit(50)
      .getMany();
  }

  // ============ 产品图片管理 ============

  /**
   * 获取产品的所有图片
   * 业务上：产品 ↔ PrintItem（一个产品一个 print_item），图片挂在 print_item 上
   */
  async getImages(productId: number) {
    const product = await this.repo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`产品 ${productId} 不存在`);

    // 找到该产品的 print_item（按 material_name 关联，最简方案）
    const printItem = await this.printItemRepo.findOne({
      where: { material_name: product.name || '' },
    });
    if (!printItem) return { product_id: productId, images: [] };

    const images = await this.printImageRepo.find({
      where: { print_item_id: printItem.id },
      order: { sort_order: 'ASC', id: 'ASC' },
    });
    return { product_id: productId, print_item_id: printItem.id, images };
  }

  /**
   * 为产品添加一张图片
   * POST /api/products/:id/images
   * body: { image_path, image_name, sort_order? }
   */
  async addImage(productId: number, data: { image_path: string; image_name: string; sort_order?: number }) {
    if (!data.image_path) throw new BadRequestException('image_path 必填');
    if (!data.image_name) throw new BadRequestException('image_name 必填');

    const product = await this.repo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`产品 ${productId} 不存在`);

    return this.dataSource.transaction(async manager => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

      // 自动创建或获取 print_item
      let printItem = await manager.findOne(PrintItem, {
        where: { material_name: product.name || '' },
      });
      if (!printItem) {
        printItem = manager.create(PrintItem, {
          color_print_id: 0,
          item_name: product.name,
          size_structure: product.box_shape || '',
          material_name: product.name || '',
          machine_size: product.spec || '',
          sort_order: 0,
          remark: `产品 ${product.code} 自动创建`,
          created_at: now,
        });
        printItem = await manager.save(printItem);
      }

      const img = manager.create(PrintItemImage, {
        print_item_id: printItem.id,
        image_path: data.image_path,
        image_name: data.image_name,
        sort_order: data.sort_order || 0,
        created_at: now,
      });
      return manager.save(img);
    });
  }

  /**
   * 批量上传图片（一次多张）
   * POST /api/products/:id/images/batch
   * body: { images: [{ image_path, image_name }] }
   */
  async batchAddImages(productId: number, data: { images: Array<{ image_path: string; image_name: string }> }) {
    if (!data.images || data.images.length === 0) {
      throw new BadRequestException('images 不能为空');
    }
    const saved: PrintItemImage[] = [];
    for (const img of data.images) {
      const s = await this.addImage(productId, img);
      saved.push(s);
    }
    return { count: saved.length, images: saved };
  }

  /**
   * 删除产品图片
   * DELETE /api/products/:id/images/:imageId
   */
  async removeImage(productId: number, imageId: number) {
    const img = await this.printImageRepo.findOne({ where: { id: imageId } });
    if (!img) throw new NotFoundException(`图片 ${imageId} 不存在`);
    await this.printImageRepo.remove(img);
    return { deleted: true, id: imageId };
  }

  /**
   * 重排图片顺序
   * PUT /api/products/:id/images/order
   * body: { image_ids: number[] }
   */
  async reorderImages(productId: number, data: { image_ids: number[] }) {
    if (!data.image_ids || data.image_ids.length === 0) {
      throw new BadRequestException('image_ids 不能为空');
    }
    const results: PrintItemImage[] = [];
    for (let i = 0; i < data.image_ids.length; i++) {
      const img = await this.printImageRepo.findOne({ where: { id: data.image_ids[i] } });
      if (img) {
        img.sort_order = i;
        results.push(await this.printImageRepo.save(img));
      }
    }
    return { count: results.length, images: results };
  }

  // ============ CRUD ============

  private async generateCode(): Promise<string> {
    const last = await this.repo
      .createQueryBuilder('p')
      .select('p.code')
      .where('p.code LIKE :prefix', { prefix: 'PK-%' })
      .orderBy('p.id', 'DESC')
      .limit(1)
      .getOne();

    if (last && last.code) {
      const match = last.code.match(/^PK-(\d+)$/);
      if (match) {
        const next = parseInt(match[1], 10) + 1;
        return `PK-${String(next).padStart(3, '0')}`;
      }
    }
    return 'PK-001';
  }

  async create(data: Partial<Product>) {
    if (!data.code || data.code.trim() === '') {
      data.code = await this.generateCode();
    }
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<Product>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Product ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`Product ${id} not found`);
    return this.repo.remove(item);
  }

  // ========== 特定图片字段上传（旧系统 products.js 4 种图片） ==========

  /**
   * 上传产品效果图（写入 product.option_image 字段）
   * POST /api/products/:id/option-image
   * body: { image_path: string }
   */
  async uploadOptionImage(id: number, data: { image_path: string }) {
    const p = await this.findOne(id);
    if (!p) throw new NotFoundException(`产品 ${id} 不存在`);
    p.option_image = data.image_path;
    return this.repo.save(p);
  }

  /**
   * 上传刀模图（写入 product.knife_die 字段）
   * POST /api/products/:id/knife-die-image
   */
  async uploadKnifeDieImage(id: number, data: { image_path: string }) {
    const p = await this.findOne(id);
    if (!p) throw new NotFoundException(`产品 ${id} 不存在`);
    p.knife_die = data.image_path;
    return this.repo.save(p);
  }

  /**
   * 上传印版图（写入 product.print_plate 字段）
   * POST /api/products/:id/print-plate-image
   */
  async uploadPrintPlateImage(id: number, data: { image_path: string }) {
    const p = await this.findOne(id);
    if (!p) throw new NotFoundException(`产品 ${id} 不存在`);
    p.print_plate = data.image_path;
    return this.repo.save(p);
  }

  /**
   * 上传成品图（写入 product.finished_product_image 字段）
   * POST /api/products/:id/finished-product-image
   */
  async uploadFinishedProductImage(id: number, data: { image_path: string }) {
    const p = await this.findOne(id);
    if (!p) throw new NotFoundException(`产品 ${id} 不存在`);
    (p as any).finished_product_image = data.image_path;
    return this.repo.save(p);
  }
}