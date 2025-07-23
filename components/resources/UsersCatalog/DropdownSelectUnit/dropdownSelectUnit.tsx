
import React, { useState } from 'react';
import styles from './dropdownSelectUnit.module.scss';
import { UnitItem } from '@/types/types';  // Путь к типу UnitItem

// Определение типов для пропсов компонента
interface DropdownSelectUnitProps {
    onSelect: (id: number | null) => void; // Колбэк для обработки выбора
    selectedValue: number | null; // Текущее выбранное значение
    units: UnitItem[]; // Массив объектов юнитов
    selectedUnits: UnitItem[]; // Массив уже выбранных юнитов (для других строк)
}

const DropdownSelectUnit: React.FC<DropdownSelectUnitProps> = ({ onSelect, selectedValue, units, selectedUnits }) => {
    // Состояние для открытия/закрытия выпадающего списка
    const [isOpen, setIsOpen] = useState(false);

    // Фильтруем юниты, исключая те, которые уже выбраны в других строках
    const availableUnits = units.filter(unit =>
        !selectedUnits.some(selectedUnit => selectedUnit.id === unit.id) ||
        selectedValue === unit.id // Позволяем выбрать юнит, если он уже выбран в текущей строке
    );

    // Обработчик для открытия/закрытия списка
    const toggleDropdown = () => setIsOpen(!isOpen);

    // Обработчик для выбора юнита
    const handleSelect = (id: number | undefined|null) => {
        onSelect(id ?? null)
        setIsOpen(false); // Закрыть список после выбора
    };

    return (
        <div className={styles.dropdownContainer}>
            {/* Выбранный юнит */}
            <div className={styles.select} onClick={toggleDropdown}>
                <div className={styles.selectedItem}>
                    {selectedValue !== null ?
                        availableUnits.find(unit => unit.id === selectedValue)?.title || "Выберите"
                        : "Выберите"}
                </div>
                <div className={styles.arrow}>&#9662;</div>
            </div>

            {/* Список доступных юнитов */}
            {isOpen && (
                <ul className={styles.dropdownList}>
                    {/* Пустой вариант для "Все" */}
                    <li
                        key=""
                        className={`${styles.dropdownItem} ${selectedValue === null ? styles.selected : ""}`}
                        onClick={() => handleSelect(null)}
                    >
                        -
                    </li>
                    {availableUnits.map((unit) => (
                        <li
                            key={unit.id}
                            className={`${styles.dropdownItem} ${unit.id === selectedValue ? styles.selected : ""}`}
                            onClick={() => handleSelect(unit.id)}
                        >
                            {unit.title} - {unit.code} {/* Можно отобразить дополнительные данные */}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DropdownSelectUnit;

