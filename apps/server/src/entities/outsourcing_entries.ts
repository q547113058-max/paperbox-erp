import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('outsourcing_entries')
export class OutsourcingEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  entry_no: string | null;

  @Column('int', { nullable: true })
  outsourcing_order_id: number | null;

  @Column('int', { nullable: true })
  work_order_id: number | null;

  @Column('varchar', { nullable: true })
  material_name: string | null;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar', { default: '待领用' })
  status: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
