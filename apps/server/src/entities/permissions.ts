import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  role: string | null;

  @Column('varchar', { nullable: true })
  module: string | null;

  @Column('varchar', { nullable: true })
  action: string | null;

  @Column('varchar')
  created_at: string;

}
