import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('suppliers')
export class Supplier {
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

  @Column('varchar')
  material_type: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar', { default: '公户' })
  settlement_type: string;

  @Column('varchar', { default: '供应商' })
  supplier_type: string;

  @Column('float', { default: 0 })
  credit_limit: number;

  @Column('int', { default: 30 })
  payment_days: number;

  @Column('varchar', { default: '月结' })
  payment_cycle: string;

  @Column('float', { default: 0 })
  rebate_percent: number;

  @Column('varchar', { default: '' })
  remark: string;

  @Column('varchar', { default: '合作中' })
  status: string;

}
