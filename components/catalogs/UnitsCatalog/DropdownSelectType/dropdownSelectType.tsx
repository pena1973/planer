import React from 'react';
import styles from './dropdownSelectType.module.scss'; 
import { UnitTypeEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectTypeProps {
    onSelect: (id: UnitTypeEnum | null) => void; // Колбэк для обработки выбора
    selectedValue: UnitTypeEnum | null; // Текущее выбранное значение
}

const DropdownSelectType: React.FC<DropdownSelectTypeProps> = ({ onSelect, selectedValue }) => {
    return (
        <select             
            className= {(selectedValue !== null)? styles.type_select:styles.type_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedId = e.target.value as UnitTypeEnum; // Получаем только id
                onSelect(selectedId); // Вызываем колбэк с выбранным id
            }}
        >
            {/* Плейсхолдер */}
            <option className={styles.placeholder} value="" disabled>Выберите</option> 
            
            {Object.keys(UnitTypeEnum).map((key) => {
                const value = UnitTypeEnum[key as keyof typeof UnitTypeEnum];
                return (
                    <option key={value} value={value}>
                        {value}
                    </option>
                );
            })}
        </select>
    );
};

export default DropdownSelectType;
