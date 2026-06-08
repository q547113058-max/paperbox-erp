import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('purchases')
export class Purchase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  purchase_no: string | null;

  @Column('int')
  supplier_id: number;

  @Column('varchar', { default: '待审批' })
  status: string;

  @Column('float', { default: 0 })
  total_amount: number;

  @Column('varchar')
  delivery_date: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  ref_type: string;

  @Column('int')
  ref_id: number;

  @Column('int')
  work_order_id: number;

  @Column('varchar')
  delivery_address: string;

}
