import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('error_logs')
export class ErrorLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  type: string | null;

  @Column('varchar')
  message: string;

  @Column('varchar')
  stack: string;

  @Column('varchar')
  source: string;

  @Column('int')
  line: number;

  @Column('int')
  column: number;

  @Column('varchar')
  url: string;

  @Column('varchar')
  user_agent: string;

  @Column('varchar', { default: '未知用户' })
  username: string;

  @Column('varchar')
  created_at: string;

}
