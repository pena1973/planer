import React from 'react';
import styles from './dropdownSelectTimeZone.module.scss'; 
import { TimeZoneEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectWeekDayProps {
    onSelect: (id: string | null) => void; // Колбэк для обработки выбора
    selectedValue: string | null; // Текущее выбранное значение
}

const DropdownSelectWeekDay: React.FC<DropdownSelectWeekDayProps> = ({ onSelect, selectedValue }) => {
    return (
        <select             
            className= {(selectedValue !== null)? styles.type_select:styles.type_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedId = e.target.value as TimeZoneEnum; // Получаем только id
                onSelect(selectedId); // Вызываем колбэк с выбранным id
            }}
        >
            {/* Плейсхолдер */}
            <option className={styles.placeholder} value="" disabled>Выберите</option> 
            
            {Object.keys(TimeZoneEnum).map((key) => {
                const value = TimeZoneEnum[key as keyof typeof TimeZoneEnum];
                return (
                    <option key={value} value={value}>
                        {value}
                    </option>
                );
            })}
        </select>
    );
};

export default DropdownSelectWeekDay;
