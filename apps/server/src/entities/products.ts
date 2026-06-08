import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  code: string;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('varchar')
  spec: string;

  @Column('float')
  length: number;

  @Column('float')
  width: number;

  @Column('float')
  height: number;

  @Column('varchar')
  material: string;

  @Column('float', { default: 0 })
  unit_price: number;

  @Column('float', { default: 0 })
  cost: number;

  @Column('float', { default: 0 })
  stock_qty: number;

  @Column('float', { default: 0 })
  safety_stock: number;

  @Column('varchar')
  created_at: string;

  @Column('varchar', { default: '平口箱' })
  box_type: string;

  @Column('varchar')
  option_image: string;

  @Column('varchar')
  knife_die: string;

  @Column('float', { default: 0 })
  price_incl_tax: number;

  @Column('float', { default: 0 })
  price_excl_tax: number;

  @Column('varchar')
  print_plate: string;

  @Column('varchar', { nullable: true, default: '正常生产' })
  status: string | null;

  @Column('varchar')
  product_type: string;

  @Column('varchar')
  finished_spec: string;

  @Column('varchar')
  box_shape: string;

  @Column('varchar')
  face_paper: string;

  @Column('varchar')
  corrugated_paper: string;

  @Column('varchar')
  print_colors: string;

  @Column('varchar')
  surface_treatment: string;

  @Column('varchar')
  processing: string;

  @Column('varchar')
  accessories: string;

  @Column('varchar')
  board_spec: string;

  @Column('varchar')
  colors: string;

  @Column('varchar')
  unit: string;

  @Column('int')
  knife_die_id: number;

  @Column('varchar')
  face_paper_size: string;

  @Column('varchar')
  corrugated_paper_size: string;

  @Column('varchar')
  finished_product_image: string;

  @Column('varchar')
  flute_type: string;

  @Column('varchar')
  face_paper_2: string;

  @Column('varchar')
  face_paper_size_2: string;

  @Column('varchar')
  corrugated_paper_2: string;

  @Column('varchar')
  corrugated_paper_size_2: string;

  @Column('int')
  knife_die_id_2: number;

  @Column('varchar')
  knife_die_2: string;

}
