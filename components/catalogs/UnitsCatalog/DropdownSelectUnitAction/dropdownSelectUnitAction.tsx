
import React from 'react';
import styles from './dropdownSelectUnitAction.module.scss'; 

// Определение типа для опций
interface Option {
    id: number;
    title: string;
}

// Определение типов для пропсов компонента
interface DropdownSelectOperProps {

    options: {id:number, title:string}[];
    onSelect: (option: Option | null) => void; // Колбэк для обработки выбора
    selectedValue: number | null; // Текущее выбранное значение 
}

const DropdownSelectOper: React.FC<DropdownSelectOperProps> = ({ options, onSelect, selectedValue }) => {
    
    return (
        <select             
            className= {(selectedValue && selectedValue !== null)? styles.oper_select:styles.oper_select_placeholder}
            value={selectedValue && selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedOption = options.find(option => option.id === Number(e.target.value)) || null;
                onSelect(selectedOption); // Вызываем колбэк с выбранной опцией
            }}
        >
            {/* Плейсхолдер */}
            <option className={styles.placeholder} value="" disabled>Выберите</option> 
            {/* <option value="" disabled></option> */}
            {options.map(option => (
                <option key={option.id} value={option.id}>
                    {option.title}
                </option>
            ))}
        </select>
    );
};

export default DropdownSelectOper;
