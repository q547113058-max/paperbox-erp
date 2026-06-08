import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('print_item_images')
export class PrintItemImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  print_item_id: number | null;

  @Column('varchar', { nullable: true })
  image_path: string | null;

  @Column('varchar')
  image_name: string;

  @Column('int', { default: 0 })
  sort_order: number;

  @Column('varchar')
  created_at: string;

}
