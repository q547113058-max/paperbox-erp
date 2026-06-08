import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar', { nullable: true })
  key: string | null;

  @Column('varchar')
  value: string;

  @Column('varchar')
  created_at: string;

}
