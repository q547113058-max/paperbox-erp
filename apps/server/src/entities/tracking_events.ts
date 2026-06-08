import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('tracking_events')
export class TrackingEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  order_tracking_id: number | null;

  @Column('varchar', { nullable: true })
  event_type: string | null;

  @Column('varchar')
  event_description: string;

  @Column('datetime')
  event_time: string;

  @Column('varchar')
  location: string;

}
