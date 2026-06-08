import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('warehouse_entries')
export class WarehouseEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  entry_no: string | null;

  @Column('int', { nullable: true })
  work_order_id: number | null;

  @Column('int')
  order_id: number;

  @Column('int', { nullable: true })
  product_id: number | null;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar', { default: '待发货' })
  status: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  product_name: string;

}
