import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('workshop_inventory')
export class WorkshopInventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  material_name: string | null;

  @Column('varchar')
  material_spec: string;

  @Column('varchar', { nullable: true })
  material_type: string | null;

  @Column('float', { default: 0 })
  quantity: number;

  @Column('varchar')
  unit: string;

  @Column('varchar')
  source_type: string;

  @Column('int')
  source_id: number;

  @Column('int')
  work_order_id: number;

  @Column('varchar', { default: '可用' })
  status: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  updated_at: string;

}
