import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('action_logs')
export class ActionLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { default: '未知用户' })
  username: string;

  @Column('varchar', { nullable: true })
  module: string | null;

  @Column('varchar', { nullable: true })
  action: string | null;

  @Column('int')
  target_id: number;

  @Column('varchar')
  target_name: string;

  @Column('varchar')
  details: string;

  @Column('varchar')
  created_at: string;

}
