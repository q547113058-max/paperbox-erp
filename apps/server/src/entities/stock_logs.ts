import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('stock_logs')
export class StockLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  product_id: number;

  @Column('varchar')
  type: string;

  @Column('float')
  quantity: number;

  @Column('varchar')
  ref_no: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
