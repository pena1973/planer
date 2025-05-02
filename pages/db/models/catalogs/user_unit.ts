
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToOne, JoinColumn } from 'typeorm';
import { TeamTable } from './teams'
import { UnitTable } from './units'
import { UserTable } from './users'

@Entity("users_units")
export class UserUnitTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @ManyToOne(() => UserTable, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: UserTable;
  @Column()
  user_id!: number;

  @ManyToOne(() => TeamTable, { eager: true })
  @JoinColumn({ name: 'team_id' })
  team!: TeamTable;
  @Column()
  team_id!: number;

 
  @ManyToOne(() => UnitTable, { eager: true, nullable: true })
  @JoinColumn({ name: 'unit_id' }) // Указываем внешний ключ для поля unit_id
  unit?: UnitTable|null;  // Ссылка на UnitTable, которая будет сгенерирована TypeORM

  @Column({ nullable: true })
  unit_id?: number|null;  // unit_id теперь является необязательным и будет генерироваться автоматически
    

  @Column({type: 'boolean', default: false })
  active!: boolean; //  запись действующая

}

