
import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';


@Entity("teams")
export class TeamTable {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени

  @Column('varchar')
  title!: string;

  @Column({ type: 'text', default: "" })
  coment!: string;

  @Column('varchar')
  prefix!: string;
      
  @Column('varchar',{ default: "" })
  main_team!: string; // основная команда в которой выставляем счет

  // Хук, который будет вызываться перед вставкой записи в базу данных
  @BeforeInsert()
  generatePrefixAndUniqueId() {
    if (!this.prefix) {
      // Генерация двух случайных латинских букв
      this.prefix = this.generateRandomPrefix();
    }

  }

  // Функция для генерации случайных двух латинских букв
  private generateRandomPrefix(): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const randomIndex1 = Math.floor(Math.random() * letters.length);
    const randomIndex2 = Math.floor(Math.random() * letters.length);

    return `${letters[randomIndex1]}${letters[randomIndex2]}`;
  }
}
