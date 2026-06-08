import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  purchase_id: number;

  @Column('varchar')
  material_name: string;

  @Column('varchar')
  spec: string;

  @Column('float')
  quantity: number;

  @Column('float')
  unit_price: number;

  @Column('float')
  amount: number;

  @Column('varchar')
  ref_info: string;

  @Column('varchar')
  paper_type: string;

  @Column('varchar')
  unit: string;

  @Column('varchar')
  delivery_address: string;

}
