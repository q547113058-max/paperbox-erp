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

  @Column('varchar', { nullable: true })
  delivery_date: string | null;

  @Column('varchar', { nullable: true })
  remark: string | null;

  @Column('varchar', { nullable: true })
  created_at: string | null;

  @Column('int', { nullable: true })
  salesman_id: number | null;

  @Column('varchar', { nullable: true })
  customer_order_no: string | null;

  @Column('varchar', { nullable: true })
  print_name: string | null;

  @Column('varchar', { nullable: true })
  customer_size: string | null;

  @Column('varchar', { nullable: true })
  die_size: string | null;

  @Column('varchar', { nullable: true })
  quantity: string | null;

  @Column('varchar', { nullable: true })
  order_date: string | null;

  @Column('varchar', { nullable: true })
  face_supplier: string | null;

  @Column('varchar', { nullable: true })
  face_material: string | null;

  @Column('varchar', { nullable: true })
  face_size: string | null;

  @Column('varchar', { nullable: true })
  face_qty: string | null;

  @Column('varchar', { nullable: true })
  medium_supplier: string | null;

  @Column('varchar', { nullable: true })
  medium_material: string | null;

  @Column('varchar', { nullable: true })
  medium_weight: string | null;

  @Column('varchar', { nullable: true })
  medium_size: string | null;

  @Column('varchar', { nullable: true })
  medium_qty: string | null;

  @Column('varchar', { nullable: true })
  print_color: string | null;

  @Column('varchar', { nullable: true })
  reference_info: string | null;

  @Column('varchar', { nullable: true })
  surface_process: string | null;

  @Column('varchar', { nullable: true })
  cost_tax: string | null;

  @Column('varchar', { nullable: true })
  cost_no_tax: string | null;

  @Column('varchar', { nullable: true })
  price_tax: string | null;

  @Column('varchar', { nullable: true })
  price_no_tax: string | null;

  @Column('varchar', { nullable: true })
  profit_margin: string | null;

  @Column('varchar', { nullable: true })
  total_tax: string | null;

  @Column('varchar', { nullable: true })
  total_no_tax: string | null;

  @Column('varchar', { nullable: true })
  face_price: string | null;

  @Column('varchar', { nullable: true })
  face_fee: string | null;

  @Column('varchar', { nullable: true })
  medium_price: string | null;

  @Column('varchar', { nullable: true })
  print_price: string | null;

  @Column('varchar', { nullable: true })
  surface_price: string | null;

  @Column('varchar', { nullable: true })
  die_price: string | null;

  @Column('varchar', { nullable: true })
  outsource_fee: string | null;

  @Column('varchar', { nullable: true })
  customer_feedback: string | null;

}
