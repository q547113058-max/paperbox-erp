import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  prod_no: string | null;

  @Column('int')
  order_id: number;

  @Column('int')
  product_id: number;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar')
  material_type: string;

  @Column('varchar')
  box_type: string;

  @Column('float')
  board_length: number;

  @Column('float')
  board_width: number;

  @Column('float')
  board_area: number;

  @Column('float')
  labor_hours: number;

  @Column('varchar')
  processes: string;

  @Column('varchar', { default: '待排产' })
  status: string;

  @Column('varchar', { default: 'normal' })
  priority: string;

  @Column('varchar')
  worker: string;

  @Column('varchar')
  start_time: string;

  @Column('varchar')
  end_time: string;

  @Column('float', { default: 0 })
  completed_qty: number;

  @Column('varchar')
  materials_json: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  entry_code: string;

  @Column('varchar')
  finished_spec: string;

}
