import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('product_customer_codes')
export class ProductCustomerCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  product_id: number | null;

  @Column('int', { nullable: true })
  customer_id: number | null;

  @Column('varchar')
  customer_product_code: string;

  @Column('varchar')
  created_at: string;

}
