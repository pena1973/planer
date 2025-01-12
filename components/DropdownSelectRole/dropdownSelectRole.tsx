import React from 'react';
import styles from './dropdownSelectRole.module.scss'; 

// Определение enum для ролей пользователя
export enum UserRoleEnum {
    OPERATOR = "оператор",
    PLANNER = "планер",
    UNIT = "юнит"
}

// Определение типа для опций
interface Option {
    id: UserRoleEnum;
    title: string;
}

// Определение типов для пропсов компонента
interface DropdownSelectRoleProps {
    options: Option[];  // Опции теперь используют UserRoleEnum
    onSelect: (option: Option | null) => void; // Колбэк для обработки выбора
    selectedValue: UserRoleEnum | null; // Текущее выбранное значение
}

const DropdownSelectRole: React.FC<DropdownSelectRoleProps> = ({ options, onSelect, selectedValue }) => {
    return (
        <select 
            className={styles.in_out_item_select} 
            value={selectedValue !== null ? selectedValue : ''} 
            onChange={e => {
                const selectedOption = options.find(option => option.id === e.target.value as UserRoleEnum) || null;
                onSelect(selectedOption); // Вызываем колбэк с выбранной опцией
            }}
        >
            <option value="" disabled>Выберите роль</option> {/* Плейсхолдер */}
            {options.map(option => (
                <option key={option.id} value={option.id}>
                    {option.title}
                </option>
            ))}
        </select>
    );
};

export default DropdownSelectRole;