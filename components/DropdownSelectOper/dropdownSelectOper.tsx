
import React from 'react';
import styles from './dropdownSelectOper.module.scss'; 

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
            className={styles.in_out_item_select} 
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedOption = options.find(option => option.id === Number(e.target.value)) || null;
                onSelect(selectedOption); // Вызываем колбэк с выбранной опцией
            }}
        >
            <option value="" disabled></option> {/* Плейсхолдер */}
            {options.map(option => (
                <option key={option.id} value={option.id}>
                    {option.title}
                </option>
            ))}
        </select>
    );
};

export default DropdownSelectOper;
