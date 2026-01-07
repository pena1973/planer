
// db/models/catalogs/user_agree.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;

@Entity("user_agree")
export class UserAgreeTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column('boolean', { default: false })
  signed!: boolean;

  @Column({ type: 'date', nullable: true })
  date!: Date | null; // дата подписания

  @Column('int')
  user_id!: number;

  @Column('int')
  agreement_id!: number;

  @Column({ type: 'text', nullable: false, default: '' })
  agreement_text_snapshot!: string;


  @Column({ type: 'varchar', length: 5, default: 'ru' })
  agreement_locale!: string;

  @Column({ type: 'timestamptz', nullable: true })
  signed_at!: Date | null; // хранится как абсолютный момент времени

}
