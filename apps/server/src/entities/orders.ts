import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  order_no: string | null;

  @Column('int')
  customer_id: number;

  @Column('varchar', { default: '待确认' })
  status: string;

  @Column('float', { default: 0 })
  total_amount: number;

  @Column('float', { default: 0 })
  total_cost: number;

  @Column('float', { default: 0 })
  profit: number;

  @Column('varchar')
  delivery_date: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

  @Column('int')
  salesman_id: number;

  @Column('varchar')
  customer_order_no: string;

  @Column('varchar')
  print_name: string;

  @Column('varchar')
  customer_size: string;

  @Column('varchar')
  die_size: string;

  @Column('varchar')
  quantity: string;

  @Column('varchar')
  order_date: string;

  @Column('varchar')
  face_supplier: string;

  @Column('varchar')
  face_material: string;

  @Column('varchar')
  face_size: string;

  @Column('varchar')
  face_qty: string;

  @Column('varchar')
  medium_supplier: string;

  @Column('varchar')
  medium_material: string;

  @Column('varchar')
  medium_weight: string;

  @Column('varchar')
  medium_size: string;

  @Column('varchar')
  medium_qty: string;

  @Column('varchar')
  print_color: string;

  @Column('varchar')
  reference_info: string;

  @Column('varchar')
  surface_process: string;

  @Column('varchar')
  cost_tax: string;

  @Column('varchar')
  cost_no_tax: string;

  @Column('varchar')
  price_tax: string;

  @Column('varchar')
  price_no_tax: string;

  @Column('varchar')
  profit_margin: string;

  @Column('varchar')
  total_tax: string;

  @Column('varchar')
  total_no_tax: string;

  @Column('varchar')
  face_price: string;

  @Column('varchar')
  face_fee: string;

  @Column('varchar')
  medium_price: string;

  @Column('varchar')
  print_price: string;

  @Column('varchar')
  surface_price: string;

  @Column('varchar')
  die_price: string;

  @Column('varchar')
  outsource_fee: string;

  @Column('varchar')
  customer_feedback: string;

}
