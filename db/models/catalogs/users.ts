import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity("users")
export class UserTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ default: "" })
  name!: string;

  @Column('varchar')
  login!: string;

  @Column('varchar')
  pass!: string;

  @Column('varchar', { default: "" })
  loginhash!: string;

  @Column('varchar', { default: "en" })
  locale!: string;

  @Column('boolean', { default: false })
  isAdmin!: boolean; //  админ команды

  @Column('boolean', { default: false })
  confirmed!: boolean; //  е мейл подтвержден

  @Column('varchar', { default: "" })
  coment!: string;

  @Column('boolean', { default: true })
  active!: boolean; //  запись действующая

  @Column('int')
  team_id!: number;

  @Column('boolean', { default: false })
  isSystem!: boolean; //  админ всей системы
  
  @Column({ name: 'password_changed_at', type: 'timestamptz', nullable: true })
  password_changed_at!: Date | null;
}
