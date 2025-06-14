
// import React from 'react';
// import styles from './dropdownSelectUnitAction.module.scss'; 

// // Определение типа для опций
// interface Option {
//     id: number;
//     title: string;
// }

// // Определение типов для пропсов компонента
// interface DropdownSelectOperProps {

//     options: {id:number, title:string}[];
//     onSelect: (option: Option | null) => void; // Колбэк для обработки выбора
//     selectedValue: number | null; // Текущее выбранное значение 
// }

// const DropdownSelectOper: React.FC<DropdownSelectOperProps> = ({ options, onSelect, selectedValue }) => {

//     return (
//         <select             
//             className= {(selectedValue && selectedValue !== null)? styles.oper_select:styles.oper_select_placeholder}
//             value={selectedValue && selectedValue !== null ? selectedValue : ''} 
//             onChange={e => {
//                 const selectedOption = options.find(option => option.id === Number(e.target.value)) || null;
//                 onSelect(selectedOption); // Вызываем колбэк с выбранной опцией
//             }}
//         >
//             {/* Плейсхолдер */}
//             <option className={styles.placeholder} value="" disabled>Выберите</option> 
//             {/* <option value="" disabled></option> */}
//             {options.map(option => (
//                 <option key={option.id} value={option.id}>
//                     {option.title}
//                 </option>
//             ))}
//         </select>
//     );
// };

// export default DropdownSelectOper;

import React, { useState } from 'react';
import styles from './dropdownSelectUnitAction.module.scss';

// Определение типа для опций
interface Option {
    id: number;
    title: string;
}

// Определение типов для пропсов компонента
interface DropdownSelectUnitActionProps {
    options: { id: number, title: string }[]; // Список всех доступных опций
    onSelect: (option: Option | null) => void; // Колбэк для обработки выбора
    selectedValue: number | null; // Текущее выбранное значение
    selectedValues: number[]; // Массив выбранных значений (для исключения этих значений в других строках)
}

const DropdownSelectUnitAction: React.FC<DropdownSelectUnitActionProps> = ({ options, onSelect, selectedValue, selectedValues }) => {
    const [isOpen, setIsOpen] = useState(false); // Состояние для открытия/закрытия выпадающего списка

    // Фильтруем опции, исключая те, которые уже выбраны в других строках
    const availableOptions = options.filter(option => !selectedValues.includes(option.id));
    const selectedOptions = options.filter(option => selectedValues.includes(option.id));

    // Обработчик для открытия/закрытия выпадающего списка
    const toggleDropdown = () => setIsOpen(prev => !prev);

    // Обработчик для выбора опции
    const handleSelect = (option: Option | null) => {
        onSelect(option); // Вызываем колбэк с выбранной опцией
        setIsOpen(false); // Закрываем выпадающий список после выбора
    };

    return (
        <div className={styles.dropdownContainer}>
            {/* Выбранная опция */}
            <div className={styles.select} onClick={toggleDropdown}>
                <div className={styles.selectedItem}>
                    {selectedValue !== null ?
                        selectedOptions.find(option => option.id === selectedValue)?.title || "Выберите"
                        : "Выберите"}
                </div>
                <div className={styles.arrow}>&#9662;</div>
            </div>

            {/* Список доступных опций */}
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
                    {availableOptions.map((option) => (
                        <li
                            key={option.id}
                            className={`${styles.dropdownItem} ${option.id === selectedValue ? styles.selected : ""}`}
                            onClick={() => handleSelect(option)}
                        >
                            {option.title}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DropdownSelectUnitAction;
