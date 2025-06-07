
import React from 'react';
import styles from './dropdownSelectOper.module.scss'; 
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation();
    return (
        <select 
            // className={styles.oper_select} 
            className= {(selectedValue !== null)? styles.oper_select:styles.oper_select_placeholder}
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedOption = options.find(option => option.id === Number(e.target.value)) || null;
                onSelect(selectedOption); // Вызываем колбэк с выбранной опцией
            }}
        >
            {/* Плейсхолдер */}
            <option className={styles.placeholder} value="" disabled>{t('dropdownselectoper.select')}</option> 
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
