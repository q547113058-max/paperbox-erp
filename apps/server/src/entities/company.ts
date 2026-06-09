import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('company')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  address: string;

  @Column('varchar', { nullable: true })
  phone: string;

  @Column('varchar', { nullable: true })
  fax: string;

  @Column('varchar', { nullable: true })
  email: string;

  @Column('varchar', { nullable: true })
  website: string;

  @Column('varchar', { nullable: true })
  logo: string;

  @Column('varchar', { nullable: true })
  bank_name: string;

  @Column('varchar', { nullable: true })
  bank_account: string;

  @Column('varchar', { nullable: true })
  tax_number: string;

  @Column('varchar', { nullable: true })
  notes: string;
}
