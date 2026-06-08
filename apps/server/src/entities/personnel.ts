import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('personnel')
export class Personnel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  name: string | null;

  @Column('varchar', { nullable: true })
  type: string | null;

  @Column('varchar')
  phone: string;

  @Column('varchar')
  department: string;

  @Column('varchar', { default: '在职' })
  status: string;

  @Column('varchar')
  remark: string;

  @Column('varchar')
  created_at: string;

}
