import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reconciliation_bills')
export class ReconciliationBill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  bill_no: string | null;

  @Column('int', { nullable: true })
  customer_id: number | null;

  @Column('varchar')
  period_start: string;

  @Column('varchar')
  period_end: string;

  @Column('float', { default: 0 })
  total_amount: number;

  @Column('float', { default: 0 })
  total_qty: number;

  @Column('varchar', { default: '待确认' })
  status: string;

  @Column('varchar')
  confirmed_at: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
