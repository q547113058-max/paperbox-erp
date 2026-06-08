import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  delivery_no: string | null;

  @Column('int')
  order_id: number;

  @Column('int')
  customer_id: number;

  @Column('int')
  work_order_id: number;

  @Column('varchar')
  work_order_completed_at: string;

  @Column('varchar', { default: '待发货' })
  status: string;

  @Column('varchar')
  delivery_date: string;

  @Column('int', { default: 0 })
  signed: number;

  @Column('varchar')
  signed_at: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  delivery_person: string;

  @Column('varchar')
  delivery_time: string;

  @Column('int')
  warehouse_entry_id: number;

  @Column('varchar')
  address: string;

  @Column('varchar')
  work_order_nos: string;

}
