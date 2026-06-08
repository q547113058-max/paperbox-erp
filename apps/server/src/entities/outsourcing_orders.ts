import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('outsourcing_orders')
export class OutsourcingOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  order_no: string | null;

  @Column('int', { nullable: true })
  work_order_id: number | null;

  @Column('varchar', { nullable: true })
  material_name: string | null;

  @Column('varchar')
  material_spec: string;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar')
  unit: string;

  @Column('int')
  supplier_id: number;

  @Column('varchar', { default: '待加工' })
  status: string;

  @Column('varchar')
  planned_date: string;

  @Column('varchar')
  completed_date: string;

  @Column('float', { default: 0 })
  received_qty: number;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

  @Column('int')
  customer_id: number;

  @Column('varchar')
  size_structure: string;

  @Column('varchar')
  paper_size: string;

  @Column('varchar')
  machine_size: string;

  @Column('float')
  machine_quantity: number;

  @Column('float')
  finished_quantity: number;

  @Column('varchar')
  print_color: string;

  @Column('varchar')
  follow_version: string;

  @Column('varchar')
  surface_treatment: string;

  @Column('float')
  unit_price: number;

  @Column('int', { default: 0 })
  is_settled: number;

}
