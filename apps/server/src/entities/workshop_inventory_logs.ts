import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workshop_inventory_logs')
export class WorkshopInventoryLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  material_name: string | null;

  @Column('varchar')
  material_spec: string;

  @Column('varchar', { nullable: true })
  type: string | null;

  @Column('float', { nullable: true })
  quantity: number | null;

  @Column('varchar')
  ref_type: string;

  @Column('int')
  ref_id: number;

  @Column('int')
  work_order_id: number;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
