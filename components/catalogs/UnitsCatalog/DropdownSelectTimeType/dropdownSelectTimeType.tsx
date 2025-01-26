import React from 'react';
import styles from './dropdownSelectTimeType.module.scss';
import { TimeTypeEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectTimeTypeProps {
    onSelect: (value: TimeTypeEnum | null) => void; // Колбэк для обработки выбора
    selectedValue: TimeTypeEnum | null; // Текущее выбранное значение
}

const DropdownSelectTimeType: React.FC<DropdownSelectTimeTypeProps> = ({ onSelect, selectedValue }) => {
    return (
        <select
            className= {(selectedValue !== null)? styles.belong_select:styles.belong_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedValue = e.target.value as TimeTypeEnum;
                onSelect(selectedValue); // Вызываем колбэк
            }}
        >
            {/* Плейсхолдер с корректным стилем */}
            <option className={styles.placeholder} value="" disabled>Выберите</option> 

            {Object.keys(TimeTypeEnum).map((key) => {
                const value = TimeTypeEnum[key as keyof typeof TimeTypeEnum];
                return (
                    <option key={key} value={value} >
                        {value}
                    </option>
                );
            })}
        </select>
    );


};

export default DropdownSelectTimeType;
