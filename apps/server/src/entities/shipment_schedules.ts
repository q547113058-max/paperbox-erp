import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('shipment_schedules')
export class ShipmentSchedule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  schedule_no: string | null;

  @Column('int', { nullable: true })
  warehouse_entry_id: number | null;

  @Column('int')
  delivery_id: number;

  @Column('int')
  order_id: number;

  @Column('int')
  customer_id: number;

  @Column('int')
  product_id: number;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar')
  planned_date: string;

  @Column('varchar', { default: '待发货' })
  status: string;

  @Column('varchar')
  driver: string;

  @Column('varchar')
  vehicle: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
