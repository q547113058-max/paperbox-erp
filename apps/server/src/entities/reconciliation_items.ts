import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reconciliation_items')
export class ReconciliationItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  bill_id: number | null;

  @Column('int', { nullable: true })
  delivery_id: number | null;

  @Column('varchar')
  delivery_no: string;

  @Column('varchar')
  product_name: string;

  @Column('float')
  quantity: number;

  @Column('float')
  unit_price: number;

  @Column('float')
  amount: number;

  @Column('varchar')
  delivery_date: string;

  @Column('varchar')
  created_at: string;

}
