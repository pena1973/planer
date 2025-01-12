import React from 'react';
import styles from './dropdownSelectBelong.module.scss';
import { UnitBelongEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectBelongProps {
    onSelect: (value: UnitBelongEnum | null) => void; // Колбэк для обработки выбора
    selectedValue: UnitBelongEnum | null; // Текущее выбранное значение
}

const DropdownSelectBelong: React.FC<DropdownSelectBelongProps> = ({ onSelect, selectedValue }) => {
    return (
        <select
            className= {(selectedValue !== null)? styles.belong_select:styles.belong_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedValue = e.target.value as UnitBelongEnum;
                onSelect(selectedValue); // Вызываем колбэк
            }}
        >
            {/* Плейсхолдер с корректным стилем */}
            <option className={styles.placeholder} value="" disabled>Выберите</option> 

            {Object.keys(UnitBelongEnum).map((key) => {
                const value = UnitBelongEnum[key as keyof typeof UnitBelongEnum];
                return (
                    <option key={key} value={value} >
                        {value}
                    </option>
                );
            })}
        </select>
    );


};

export default DropdownSelectBelong;
