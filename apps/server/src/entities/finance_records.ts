import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('finance_records')
export class FinanceRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  type: string | null;

  @Column('varchar')
  ref_no: string;

  @Column('varchar')
  ref_type: string;

  @Column('varchar')
  party_name: string;

  @Column('float', { nullable: true })
  amount: number | null;

  @Column('varchar', { default: '未结清' })
  status: string;

  @Column('varchar')
  due_date: string;

  @Column('varchar')
  paid_at: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  period_type: string;

  @Column('varchar')
  category: string;

  @Column('varchar')
  description: string;

  @Column('varchar')
  canceled_at: string;

  @Column('varchar')
  canceled_reason: string;

  @Column('varchar')
  canceled_by: string;

}
