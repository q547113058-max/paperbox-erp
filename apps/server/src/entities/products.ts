import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  code: string;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('varchar', { nullable: true })
  spec: string | null;

  @Column('float', { nullable: true })
  length: number | null;

  @Column('float', { nullable: true })
  width: number | null;

  @Column('float', { nullable: true })
  height: number | null;

  @Column('varchar', { nullable: true })
  material: string | null;

  @Column('float', { default: 0 })
  unit_price: number;

  @Column('float', { default: 0 })
  cost: number;

  @Column('float', { default: 0 })
  stock_qty: number;

  @Column('float', { default: 0 })
  safety_stock: number;

  @Column('varchar', { nullable: true })
  created_at: string | null;

  @Column('varchar', { default: '平口箱' })
  box_type: string;

  @Column('varchar', { nullable: true })
  option_image: string | null;

  @Column('varchar', { nullable: true })
  knife_die: string | null;

  @Column('varchar', { nullable: true })
  print_plate: string | null;

  @Column('varchar', { nullable: true, default: '正常生产' })
  status: string | null;

  @Column('varchar', { nullable: true })
  product_type: string | null;

  @Column('varchar', { nullable: true })
  finished_spec: string | null;

  @Column('varchar', { nullable: true })
  box_shape: string | null;

  @Column('varchar', { nullable: true })
  face_paper: string | null;

  @Column('varchar', { nullable: true })
  corrugated_paper: string | null;

  @Column('varchar', { nullable: true })
  print_colors: string | null;

  @Column('varchar', { nullable: true })
  surface_treatment: string | null;

  @Column('varchar', { nullable: true })
  processing: string | null;

  @Column('varchar', { nullable: true })
  accessories: string | null;

  @Column('varchar', { nullable: true })
  board_material: string | null;

  @Column('varchar', { nullable: true })
  board_spec: string | null;

  @Column('varchar', { nullable: true })
  colors: string | null;

  @Column('varchar', { nullable: true })
  unit: string | null;

  @Column('int', { nullable: true })
  knife_die_id: number | null;

  @Column('varchar', { nullable: true })
  face_paper_size: string | null;

  @Column('varchar', { nullable: true })
  corrugated_paper_size: string | null;

  @Column('varchar', { nullable: true })
  finished_product_image: string | null;

  @Column('varchar', { nullable: true })
  flute_type: string | null;

  @Column('varchar', { nullable: true })
  face_paper_2: string | null;

  @Column('varchar', { nullable: true })
  face_paper_size_2: string | null;

  @Column('varchar', { nullable: true })
  corrugated_paper_2: string | null;

  @Column('varchar', { nullable: true })
  corrugated_paper_size_2: string | null;

  @Column('int', { nullable: true })
  knife_die_id_2: number | null;

  @Column('varchar', { nullable: true })
  knife_die_2: string | null;

  @Column('varchar', { nullable: true })
  customer_code: string | null;

  @Column('varchar', { nullable: true })
  remark: string | null;

}
