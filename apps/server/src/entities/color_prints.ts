import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('color_prints')
export class ColorPrint {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  print_no: string | null;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('int')
  product_id: number;

  @Column('int')
  customer_id: number;

  @Column('varchar', { default: '正常' })
  status: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

  @Column('varchar', { default: '' })
  print_color: string;

  @Column('varchar', { default: '' })
  surface_treatment: string;

}
