import React from 'react';
import styles from './dropdownSelectWeekDay.module.scss'; 
import { DaysOfWeek } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectWeekDayProps {
    onSelect: (id: DaysOfWeek | null) => void; // Колбэк для обработки выбора
    selectedValue: DaysOfWeek | null; // Текущее выбранное значение
}

const DropdownSelectWeekDay: React.FC<DropdownSelectWeekDayProps> = ({ onSelect, selectedValue }) => {
    return (
        <select             
            className= {(selectedValue !== null)? styles.type_select:styles.type_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedId = e.target.value as DaysOfWeek; // Получаем только id
                onSelect(selectedId); // Вызываем колбэк с выбранным id
            }}
        >
            {/* Плейсхолдер */}
            <option className={styles.placeholder} value="" disabled>Выберите</option> 
            
            {Object.keys(DaysOfWeek).map((key) => {
                const value = DaysOfWeek[key as keyof typeof DaysOfWeek];
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
