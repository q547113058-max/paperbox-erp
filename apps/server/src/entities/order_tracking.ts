import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('order_tracking')
export class OrderTracking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int', { nullable: true })
  order_id: number | null;

  @Column('varchar')
  tracking_number: string;

  @Column('varchar')
  carrier: string;

  @Column('varchar', { default: 'pending' })
  status: string;

  @Column('datetime')
  estimated_delivery: string;

  @Column('datetime')
  actual_delivery: string;

  @Column('datetime')
  created_at: string;

  @Column('datetime')
  updated_at: string;

}
