import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  prod_no: string | null;

  @Column('int')
  order_id: number;

  @Column('int')
  product_id: number;

  @Column('float')
  quantity: number;

  @Column('varchar', { default: '待排产' })
  status: string;

  @Column('varchar')
  worker: string;

  @Column('varchar')
  start_time: string;

  @Column('varchar')
  end_time: string;

  @Column('float', { default: 0 })
  completed_qty: number;

  @Column('varchar')
  created_at: string;

}
