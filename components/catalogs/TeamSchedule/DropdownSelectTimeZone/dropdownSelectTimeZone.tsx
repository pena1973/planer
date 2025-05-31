import React, { useState } from 'react';
import styles from './dropdownSelectTimeZone.module.scss';
import { TimeZoneEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectTimeZoneProps {
    onSelect: (id: string | null) => void; // Колбэк для обработки выбора
    selectedValue: string | null; // Текущее выбранное значение
}

const DropdownSelectTimeZone: React.FC<DropdownSelectTimeZoneProps> = ({ onSelect, selectedValue }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления открытием/закрытием списка

    // Функция для открытия/закрытия списка
    const toggleDropdown = () => setIsOpen(prev => !prev);

    // Обработчик выбора значения
    const handleSelect = (value: string | null) => {
        onSelect(value); // Передаем выбранное значение в родительский компонент
        setIsOpen(false); // Закрываем список после выбора
    };

    return (
        <div className={styles.dropdownContainer}>
            {/* Выбранное значение */}
            <div
                className={styles.select}
                onClick={toggleDropdown}
            >
                {selectedValue !== null ? selectedValue : "Выберите"}
                <div className={styles.arrow}>&#9662;</div>
            </div>

            {/* Выпадающий список */}
            {isOpen && (
                <ul className={styles.dropdownList}>
                    <li
                        key="none"
                        className={`${styles.dropdownItem} ${selectedValue === null ? styles.selected : ""}`}
                        onClick={() => handleSelect(null)}
                    >
                        -
                    </li>
                    {Object.keys(TimeZoneEnum).map((key) => {
                        const value = TimeZoneEnum[key as keyof typeof TimeZoneEnum];
                        return (
                            <li
                                key={value}
                                className={`${styles.dropdownItem} ${value === selectedValue ? styles.selected : ""}`}
                                onClick={() => handleSelect(value)}
                            >
                                {value}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default DropdownSelectTimeZone;
