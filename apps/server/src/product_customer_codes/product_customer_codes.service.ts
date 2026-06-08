import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCustomerCode } from '../entities/product_customer_codes';

@Injectable()
export class ProductCustomerCodeService {
  constructor(
    @InjectRepository(ProductCustomerCode)
    private readonly repo: Repository<ProductCustomerCode>,
  ) {}

  findAll() { return this.repo.find({ order: { id: 'DESC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ProductCustomerCode>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<ProductCustomerCode>) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`product_customer_codes ${id} not found`);
    Object.assign(item, data);
    return this.repo.save(item);
  }
  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new NotFoundException(`product_customer_codes ${id} not found`);
    return this.repo.remove(item);
  }
}
