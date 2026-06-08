import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('print_items')
export class PrintItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  color_print_id: number | null;

  @Column('varchar', { nullable: true })
  item_name: string | null;

  @Column('varchar')
  size_structure: string;

  @Column('varchar')
  material_name: string;

  @Column('varchar')
  machine_size: string;

  @Column('int', { default: 0 })
  sort_order: number;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
