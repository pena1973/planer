
// db/models/catalogs/templates.ts
import * as TypeORM from "typeorm";
const { Entity, PrimaryGeneratedColumn, Column } = TypeORM;


@Entity("templates")
export class TemplateTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date; // Время создания записи

    @Column('varchar',{ default: '' })
    name!: string; // Название шаблона

    @Column('text')
    fileContent!: string; // Содержимое файла в формате JSON (содержимое карты)

    
    @Column('int')
    team_id!: number; // Внешний ключ на команду

}
