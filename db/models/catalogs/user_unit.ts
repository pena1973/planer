
// db/models/catalogs/user_unit.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;


@Entity("users_units")
export class UserUnitTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  

  @Column('int')
  user_id!: number;

  @Column('int')
  team_id!: number;

  @Column('int',{ nullable: true })
  unit_id?: number|null;     

  @Column('boolean',{ default: false })
  active!: boolean; //  запись действующая

}

