import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('materials')
export class Material {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('varchar')
  spec: string;

  @Column('varchar')
  unit: string;

  @Column('float', { default: 0 })
  quantity: number;

  @Column('float', { default: 0 })
  avg_price: number;

  @Column('float', { default: 0 })
  safety_stock: number;

  @Column('int')
  supplier_id: number;

  @Column('varchar')
  created_at: string;

  @Column('varchar', { default: '外购件' })
  material_type: string;

}
