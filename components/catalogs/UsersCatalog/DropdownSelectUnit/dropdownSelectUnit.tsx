
import React from 'react';
import styles from './dropdownSelectUnit.module.scss'; 
import { UnitItem } from '@/types';  // Путь к типу UnitItem

// Определение типов для пропсов компонента
interface DropdownSelectUnitProps {
    onSelect: (id: number | null) => void; // Колбэк для обработки выбора
    selectedValue: number | null; // Текущее выбранное значение
    units: UnitItem[]; // Массив объектов юнитов
}

const DropdownSelectUnit: React.FC<DropdownSelectUnitProps> = ({ onSelect, selectedValue, units }) => {
    return (
        <select
            className={selectedValue !== null ? styles.type_select : styles.type_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''}
            onChange={e => {
                const selectedId = parseInt(e.target.value); // Получаем id выбранного юнита
                onSelect(selectedId); // Вызываем колбэк с выбранным id
            }}
        >
            {/* Плейсхолдер */}
            <option className={styles.placeholder} value="" disabled>Выберите юнит</option> 
            
            {units.map((unit) => {
                return (
                    <option key={unit.id} value={unit.id}>
                        {unit.title} - {unit.code} {/* Можно отобразить дополнительные данные */}
                    </option>
                );
            })}
        </select>
    );
};

export default DropdownSelectUnit;
