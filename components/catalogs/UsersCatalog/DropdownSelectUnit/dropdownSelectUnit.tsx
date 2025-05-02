import React from 'react';
import styles from './dropdownSelectUnit.module.scss'; 
import { UnitItem } from '@/types';  // Путь к типу UnitItem

// Определение типов для пропсов компонента
interface DropdownSelectUnitProps {
    onSelect: (id: number | null) => void; // Колбэк для обработки выбора
    selectedValue: number | null; // Текущее выбранное значение
    units: UnitItem[]; // Массив объектов юнитов
    selectedUnits: UnitItem[]; // Массив уже выбранных юнитов (для других строк)
}

const DropdownSelectUnit: React.FC<DropdownSelectUnitProps> = ({ onSelect, selectedValue, units, selectedUnits }) => {
    // Фильтруем юниты, исключая те, которые уже выбраны в других строках
    const availableUnits = units.filter(unit => 
        !selectedUnits.some(selectedUnit => selectedUnit.id === unit.id) ||
        selectedValue === unit.id // Позволяем выбрать юнит, если он уже выбран в текущей строке
    );

    return (
        <div className={styles.dropdownContainer}>
            {/* Выпадающий список для выбора юнита */}
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

                {availableUnits.map((unit) => {
                    return (
                        <option key={unit.id} value={unit.id}>
                            {unit.title} - {unit.code} {/* Можно отобразить дополнительные данные */}
                        </option>
                    );
                })}
            </select> 
            
            {/* Кнопка для очистки выбора */}
            <button onClick={() => onSelect(null)}> х </button>
        </div>
    );
};

export default DropdownSelectUnit;



