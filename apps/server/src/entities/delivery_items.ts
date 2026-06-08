import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('delivery_items')
export class DeliveryItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  delivery_id: number;

  @Column('int')
  product_id: number;

  @Column('float')
  quantity: number;

  @Column('int')
  warehouse_entry_id: number;

  @Column('float', { default: 0 })
  unit_price: number;

  @Column('varchar', { default: '' })
  remark: string;

}
