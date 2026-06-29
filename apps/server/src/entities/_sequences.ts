/* @deprecated - not registered in AppModule, no references */
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('_sequences')
export class Sequence {
  @Column('varchar')
  name: string;

  @Column('int', { nullable: true, default: 0 })
  value: number | null;

}
