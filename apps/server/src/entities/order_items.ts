import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  order_id: number;

  @Column('int')
  product_id: number;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('float', { nullable: true })
  unit_price: number | null;

  @Column('float')
  amount: number;

  @Column('float', { default: 0 })
  delivered_qty: number;

  @Column('varchar')
  customer_product_code: string;

  @Column('varchar')
  delivery_date: string;

  @Column('varchar')
  remark: string;

  @Column('varchar', { default: '' })
  order_date: string;

}
