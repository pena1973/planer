// import React from 'react';
// import styles from './dropdownSelectBelong.module.scss';
// import { UnitBelongEnum } from '@/types';

// // Определение типов для пропсов компонента
// interface DropdownSelectBelongProps {
//     onSelect: (value: UnitBelongEnum | null) => void; // Колбэк для обработки выбора
//     selectedValue: UnitBelongEnum | null; // Текущее выбранное значение
// }

// const DropdownSelectBelong: React.FC<DropdownSelectBelongProps> = ({ onSelect, selectedValue }) => {
//     return (
//         <select
//             className= {(selectedValue !== null)? styles.belong_select:styles.belong_select_placeholder}
//             value={selectedValue !== null ? selectedValue : ''} 
//             onChange={e => {
//                 const selectedValue = e.target.value as UnitBelongEnum;
//                 onSelect(selectedValue); // Вызываем колбэк
//             }}
//         >
//             {/* Плейсхолдер с корректным стилем */}
//             <option className={styles.placeholder} value="" disabled>Выберите</option> 

//             {Object.keys(UnitBelongEnum).map((key) => {
//                 const value = UnitBelongEnum[key as keyof typeof UnitBelongEnum];
//                 return (
//                     <option key={key} value={value} >
//                         {value}
//                     </option>
//                 );
//             })}
//         </select>
//     );


// };

// export default DropdownSelectBelong;
import React, { useState } from 'react';
import styles from './dropdownSelectBelong.module.scss';
import { UnitBelongEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectBelongProps {
    onSelect: (value: UnitBelongEnum | null) => void; // Колбэк для обработки выбора
    selectedValue: UnitBelongEnum | null; // Текущее выбранное значение
}

const DropdownSelectBelong: React.FC<DropdownSelectBelongProps> = ({ onSelect, selectedValue }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления открытием/закрытием выпадающего списка

    // Функция для открытия/закрытия списка
    const toggleDropdown = () => setIsOpen(prev => !prev);

    // Обработчик выбора значения
    const handleSelect = (value: UnitBelongEnum | null) => {
        onSelect(value); // Передаем выбранное значение в родительский компонент
        setIsOpen(false); // Закрываем список после выбора
    };

    return (
        <div className={styles.dropdownContainer}>
            {/* Выбранное значение */}
            <div 
                className={selectedValue !== null ? styles.select : styles.belong_select_placeholder}
                onClick={toggleDropdown}
            >
                {selectedValue ? UnitBelongEnum[selectedValue] : "Выберите"}
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
                    {Object.keys(UnitBelongEnum).map((key) => {
                        const value = UnitBelongEnum[key as keyof typeof UnitBelongEnum];
                        return (
                            <li
                                key={key}
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

export default DropdownSelectBelong;
