import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('spec_options')
export class SpecOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  category: string | null;

  @Column('varchar', { nullable: true })
  value: string | null;

  @Column('int', { default: 0 })
  sort_order: number;

  @Column('varchar')
  created_at: string;

  @Column('varchar')
  image: string;

}
