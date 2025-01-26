import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyTable } from '../catalogs/companies'; // Подключаем сущность для связи
import { UnitTable } from '../catalogs/units'; // Подключаем сущность для связи

@Entity("unit_loads")
export class UnitLoadTable {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at!: Date;  // Используем тип Date и задаем значение по умолчанию для UTC времени
    
    @Column('date')
    date!: Date; // дата операции

    @Column('int')
    idc_oper!: number; // Идентификатор операции

    @Column('int')
    id_tCard!: number; // Идентификатор тех карты

    @Column('bigint')
    timeStart!: number; // Время начала в миллисекундах

    @Column('bigint')
    timeFinish!: number; // Время окончания в миллисекундах


    @ManyToOne(() => CompanyTable, { eager: true }) // Указываем связь "многие к одному"
    @JoinColumn({ name: 'company_id' }) // Указываем колонку, которая является внешним ключом
    company!: CompanyTable;  // Связь с таблицей CompanyTable
    @Column()
    company_id!: number

    @ManyToOne(() => UnitTable, { eager: true })
    @JoinColumn({ name: 'unit_id' }) 
    unit!: UnitTable;  
     
    @Column()
    unit_id!: number  
}
