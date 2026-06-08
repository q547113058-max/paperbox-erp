import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('work_order_materials')
export class WorkOrderMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  work_order_id: number | null;

  @Column('varchar', { nullable: true })
  material_name: string | null;

  @Column('varchar')
  material_spec: string;

  @Column('varchar', { nullable: true })
  material_type: string | null;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar')
  unit: string;

  @Column('float', { nullable: true })
  required_qty: number | null;

  @Column('float', { default: 0 })
  available_qty: number;

  @Column('float', { default: 0 })
  shortage_qty: number;

  @Column('varchar', { default: '待采购' })
  status: string;

  @Column('int')
  purchase_order_id: number;

  @Column('int')
  outsourcing_order_id: number;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
