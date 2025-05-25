// import React from 'react';
// import styles from './dropdownSelectType.module.scss'; 
// import { UnitTypeEnum } from '@/types';

// // Определение типов для пропсов компонента
// interface DropdownSelectTypeProps {
//     onSelect: (id: UnitTypeEnum | null) => void; // Колбэк для обработки выбора
//     selectedValue: UnitTypeEnum | null; // Текущее выбранное значение
// }

// const DropdownSelectType: React.FC<DropdownSelectTypeProps> = ({ onSelect, selectedValue }) => {
//     return (
//         <select             
//             className= {(selectedValue !== null)? styles.type_select:styles.type_select_placeholder}
//             value={selectedValue !== null ? selectedValue : ''} 
//             onChange={e => {
//                 const selectedId = e.target.value as UnitTypeEnum; // Получаем только id
//                 onSelect(selectedId); // Вызываем колбэк с выбранным id
//             }}
//         >
//             {/* Плейсхолдер */}
//             <option className={styles.placeholder} value="" disabled>Выберите</option> 
            
//             {Object.keys(UnitTypeEnum).map((key) => {
//                 const value = UnitTypeEnum[key as keyof typeof UnitTypeEnum];
//                 return (
//                     <option key={value} value={value}>
//                         {value}
//                     </option>
//                 );
//             })}
//         </select>
//     );
// };


// export default DropdownSelectType;
import React, { useState } from 'react';
import styles from './dropdownSelectType.module.scss'; 
import { UnitTypeEnum } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectTypeProps {
    onSelect: (id: UnitTypeEnum | null) => void; // Колбэк для обработки выбора
    selectedValue: UnitTypeEnum | null; // Текущее выбранное значение
}

const DropdownSelectType: React.FC<DropdownSelectTypeProps> = ({ onSelect, selectedValue }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для отображения выпадающего списка

    // Открытие и закрытие выпадающего списка
    const toggleDropdown = () => setIsOpen(prev => !prev);

    // Обработчик выбора значения
    const handleSelect = (value: UnitTypeEnum | null) => {
        onSelect(value); // Передаем выбранное значение в родительский компонент
        setIsOpen(false); // Закрываем выпадающий список после выбора
    };

    return (
        <div className={styles.dropdownContainer}>
            {/* Выбранное значение */}
            <div 
                className={selectedValue !== null ? styles.select : styles.type_select_placeholder}
                onClick={toggleDropdown}
            >
                {selectedValue ? UnitTypeEnum[selectedValue] : "Выберите"}
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
                    {Object.keys(UnitTypeEnum).map((key) => {
                        const value = UnitTypeEnum[key as keyof typeof UnitTypeEnum];
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

export default DropdownSelectType;
