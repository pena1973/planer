// import React from 'react';
// import styles from './dropdownSelectWeekDay.module.scss'; 
// import { DaysOfWeek } from '@/types';

// // Определение типов для пропсов компонента
// interface DropdownSelectWeekDayProps {
//     onSelect: (id: DaysOfWeek | null) => void; // Колбэк для обработки выбора
//     selectedValue: DaysOfWeek | null; // Текущее выбранное значение
// }

// const DropdownSelectWeekDay: React.FC<DropdownSelectWeekDayProps> = ({ onSelect, selectedValue }) => {
//     return (
//         <select             
//             className= {(selectedValue !== null)? styles.type_select:styles.type_select_placeholder}
//             value={selectedValue !== null ? selectedValue : ''} 
//             onChange={e => {
//                 const selectedId = e.target.value as DaysOfWeek; // Получаем только id
//                 onSelect(selectedId); // Вызываем колбэк с выбранным id
//             }}
//         >
//             {/* Плейсхолдер */}
//             <option className={styles.placeholder} value="" disabled>Выберите</option> 

//             {Object.keys(DaysOfWeek).map((key) => {
//                 const value = DaysOfWeek[key as keyof typeof DaysOfWeek];
//                 return (
//                     <option key={value} value={value}>
//                         {value}
//                     </option>
//                 );
//             })}
//         </select>
//     );
// };

//export default DropdownSelectWeekDay;

// import React, { useState } from 'react';
// import styles from './dropdownSelectWeekDay.module.scss';
// import { DaysOfWeek } from '@/types';

// // Определение типов для пропсов компонента
// interface DropdownSelectWeekDayProps {
//     onSelect: (id: DaysOfWeek | null) => void; // Колбэк для обработки выбора
//     selectedValue: DaysOfWeek | null; // Текущее выбранное значение
//     selectedValues: DaysOfWeek[]; // Массив уже выбранных значений
// }

// const DropdownSelectWeekDay: React.FC<DropdownSelectWeekDayProps> = ({ onSelect, selectedValue, selectedValues }) => {
//     const [isOpen, setIsOpen] = useState(false); // Состояние для управления открытием/закрытием выпадающего списка

//     // Функция для открытия/закрытия списка
//     const toggleDropdown = () => setIsOpen(prev => !prev);

//     // Обработчик выбора значения
//     const handleSelect = (value: DaysOfWeek | null) => {
//         onSelect(value); // Передаем выбранное значение в родительский компонент
//         setIsOpen(false); // Закрываем список после выбора
//     };
//   // Фильтруем дни , исключая те, которые уже выбраны в других строках
//   const availableValues = DaysOfWeek.filter(day =>
//     !selectedValues.some(selectedValues => day === unit.id) ||
//     selectedValue === unit.id // Позволяем выбрать юнит, если он уже выбран в текущей строке
// );

//     return (
//         <div className={styles.dropdownContainer}>
//             {/* Выбранное значение */}
//             <div
//                 className={styles._select}
//                 onClick={toggleDropdown}
//             >
//                 {selectedValue ? DaysOfWeek[selectedValue] : "Выберите"}
//                 <div className={styles.arrow}>&#9662;</div>
//             </div>

//             {/* Выпадающий список */}
//             {isOpen && (
//                 <ul className={styles.dropdownList}>
//                     <li
//                         key="none"
//                         className={`${styles.dropdownItem} ${selectedValue === null ? styles.selected : ""}`}
//                         onClick={() => handleSelect(null)}
//                     >
//                         -
//                     </li>
//                     {Object.keys(DaysOfWeek).map((key) => {
//                         const value = DaysOfWeek[key as keyof typeof DaysOfWeek];
//                         // Проверяем, если значение уже выбрано, не показываем его в списке
//                         if (selectedValues.includes(value) ) return null;
//                         return (
//                             <li
//                                 key={value}
//                                 className={`${styles.dropdownItem} ${value === selectedValue ? styles.selected : ""}`}
//                                 onClick={() => handleSelect(value)}
//                             >
//                                 {value}
//                             </li>
//                         );
//                     })}
//                 </ul>
//             )}

       

//         </div>
//     );
// };

// export default DropdownSelectWeekDay;

import React, { useState } from 'react';
import styles from './dropdownSelectWeekDay.module.scss';
import { DaysOfWeek } from '@/types';

// Определение типов для пропсов компонента
interface DropdownSelectWeekDayProps {
    onSelect: (id: DaysOfWeek | null) => void; // Колбэк для обработки выбора
    selectedValue: DaysOfWeek | null; // Текущее выбранное значение
    selectedValues: DaysOfWeek[]; // Массив уже выбранных значений
}

const DropdownSelectWeekDay: React.FC<DropdownSelectWeekDayProps> = ({ onSelect, selectedValue, selectedValues }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для управления открытием/закрытием выпадающего списка

    // Функция для открытия/закрытия списка
    const toggleDropdown = () => setIsOpen(prev => !prev);

    // Обработчик выбора значения
    const handleSelect = (value: DaysOfWeek | null) => {
        onSelect(value); // Передаем выбранное значение в родительский компонент
        setIsOpen(false); // Закрываем список после выбора
    };

    // Фильтруем дни недели, исключая те, которые уже выбраны в других строках
    const availableValues = Object.keys(DaysOfWeek).map(key => DaysOfWeek[key as keyof typeof DaysOfWeek])
        .filter(day => !selectedValues.includes(day) || selectedValue === day); // Исключаем выбранные значения

    return (
        <div className={styles.dropdownContainer}>
            {/* Выбранное значение */}
            <div
                className={styles.select}
                onClick={toggleDropdown}
            >
                {selectedValue ? DaysOfWeek[selectedValue] : "Выберите"}
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
                    {availableValues.map((value) => {
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

export default DropdownSelectWeekDay;
