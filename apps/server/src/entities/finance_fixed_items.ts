import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('finance_fixed_items')
export class FinanceFixedItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('varchar', { nullable: true })
  type: string | null;

  @Column('varchar')
  category: string;

  @Column('float', { nullable: true })
  amount: number | null;

  @Column('varchar')
  party_name: string;

  @Column('varchar', { default: '月' })
  period_type: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  last_applied: string;

}
