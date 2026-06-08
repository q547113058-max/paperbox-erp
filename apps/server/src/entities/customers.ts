import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('varchar')
  contact: string;

  @Column('varchar')
  phone: string;

  @Column('varchar')
  address: string;

  @Column('float', { default: 0 })
  credit_limit: number;

  @Column('int', { default: 30 })
  payment_days: number;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  salesman: string;

  @Column('int', { default: 1 })
  tax_included: number;

  @Column('varchar', { default: '月结' })
  payment_cycle: string;

  @Column('float', { default: 0 })
  rebate_percent: number;

  @Column('varchar', { default: '公户' })
  settlement_type: string;

  @Column('varchar', { default: '' })
  remark: string;

}
