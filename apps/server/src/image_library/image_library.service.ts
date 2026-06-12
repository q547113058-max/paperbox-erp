import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/products';
import { KnifeDie } from '../entities/knife_dies';
import { PrintItemImage } from '../entities/print_item_images';
import { PrintItem } from '../entities/print_items';
import { ColorPrint } from '../entities/color_prints';

@Injectable()
export class ImageLibraryService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(KnifeDie)
    private readonly knifeDieRepo: Repository<KnifeDie>,
    @InjectRepository(PrintItemImage)
    private readonly printImageRepo: Repository<PrintItemImage>,
    @InjectRepository(PrintItem)
    private readonly printItemRepo: Repository<PrintItem>,
    @InjectRepository(ColorPrint)
    private readonly colorPrintRepo: Repository<ColorPrint>,
  ) {}

  /**
   * 刀模图片库：按图片分组，返回使用该图片的产品
   * GET /api/image-library/knife-dies
   */
  async getKnifeDieImages() {
    // 方式1: 产品直接引用的刀模图片
    const direct = await this.productRepo
      .createQueryBuilder('p')
      .select(['p.knife_die as image', 'p.id as product_id', 'p.name as product_name', 'p.code as product_code'])
      .where('p.knife_die IS NOT NULL AND p.knife_die != :empty', { empty: '' })
      .orderBy('p.knife_die', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .getRawMany();

    // 方式2: 刀模表自身的图片
    const fromKd = await this.knifeDieRepo
      .createQueryBuilder('kd')
      .leftJoin(Product, 'p', 'p.knife_die_id = kd.id')
      .select([
        'kd.image as image',
        'kd.id as knife_die_id',
        'kd.code as knife_die_code',
        'p.id as product_id',
        'p.name as product_name',
        'p.code as product_code',
      ])
      .where('kd.image IS NOT NULL AND kd.image != :empty', { empty: '' })
      .orderBy('kd.image', 'ASC')
      .getRawMany();

    // 合并两种来源
    const map = new Map<string, { image: string; products: any[]; source: string; knife_die_code: string | null }>();

    for (const row of direct) {
      if (!map.has(row.image)) {
        map.set(row.image, { image: row.image, products: [], source: 'product', knife_die_code: null });
      }
      if (row.product_id) {
        map.get(row.image)!.products.push({ id: row.product_id, name: row.product_name, code: row.product_code });
      }
    }

    for (const row of fromKd) {
      if (!map.has(row.image)) {
        map.set(row.image, { image: row.image, products: [], source: 'knife_die', knife_die_code: row.knife_die_code });
      } else {
        const entry = map.get(row.image)!;
        if (!entry.knife_die_code && row.knife_die_code) entry.knife_die_code = row.knife_die_code;
      }
      if (row.product_id) {
        const entry = map.get(row.image)!;
        if (!entry.products.find(p => p.id === row.product_id)) {
          entry.products.push({ id: row.product_id, name: row.product_name, code: row.product_code });
        }
      }
    }

    return Array.from(map.values()).filter(g => g.products.length > 0);
  }

  /**
   * 彩印图片库：按图片分组，返回使用该图片的产品
   * GET /api/image-library/print-plates
   */
  async getPrintPlateImages() {
    const rows = await this.printImageRepo
      .createQueryBuilder('pii')
      .leftJoin(PrintItem, 'pi', 'pi.id = pii.print_item_id')
      .leftJoin(ColorPrint, 'cp', 'cp.id = pi.color_print_id')
      .leftJoin(Product, 'p', 'p.id = cp.product_id')
      .select([
        'pii.image_path as image',
        'p.id as product_id',
        'p.name as product_name',
        'p.code as product_code',
        'cp.name as color_print_name',
        'cp.print_no as color_print_no',
      ])
      .where('pii.image_path IS NOT NULL AND pii.image_path != :empty', { empty: '' })
      .orderBy('pii.image_path', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .getRawMany();

    const map = new Map<string, { image: string; products: any[]; color_print_nos: string[] }>();

    for (const row of rows) {
      if (!map.has(row.image)) {
        map.set(row.image, { image: row.image, products: [], color_print_nos: [] });
      }
      const entry = map.get(row.image)!;
      if (row.color_print_no && !entry.color_print_nos.includes(row.color_print_no)) {
        entry.color_print_nos.push(row.color_print_no);
      }
      if (row.product_id && !entry.products.find(p => p.id === row.product_id)) {
        entry.products.push({ id: row.product_id, name: row.product_name, code: row.product_code });
      }
    }

    return Array.from(map.values());
  }
}
