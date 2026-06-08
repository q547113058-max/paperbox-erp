import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('knife_dies')
export class KnifeDie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  code: string | null;

  @Column('varchar')
  image: string;

  @Column('float', { default: 20 })
  face_hole_height: number;

  @Column('float', { default: 20 })
  face_paper_length: number;

  @Column('float', { default: 15 })
  corrugated_hole_height: number;

  @Column('float', { default: 15 })
  corrugated_paper_length: number;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  customer: string;

  @Column('varchar')
  product_name: string;

  @Column('varchar')
  spec_cm: string;

  @Column('varchar')
  template_mm: string;

  @Column('varchar')
  die_cutting: string;

  @Column('float', { default: 0 })
  fee: number;

  @Column('varchar')
  box_type: string;

}
