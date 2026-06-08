import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  username: string | null;

  @Column('varchar', { nullable: true })
  password: string | null;

  @Column('varchar')
  real_name: string;

  @Column('varchar', { default: 'user' })
  role: string;

  @Column('varchar', { default: 'active' })
  status: string;

  @Column('varchar')
  created_at: string;

}
