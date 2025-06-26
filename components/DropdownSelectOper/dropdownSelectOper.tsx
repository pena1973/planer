
import React, { useState } from 'react';
import styles from './dropdownSelectOper.module.scss';
import { useTranslation } from 'react-i18next';

interface Option {
    id: number;
    title: string;
}

interface DropdownSelectOperProps {
    options: Option[];
    onSelect: (option: Option | null) => void;
    selectedValue: number | null;
}

const DropdownSelectOper: React.FC<DropdownSelectOperProps> = ({ options, onSelect, selectedValue }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleSelect = (option: Option | null) => {
        onSelect(option);
        setIsOpen(false);
    };

    const selectedTitle = selectedValue !== null
        ? options.find(opt => opt.id === selectedValue)?.title
        : t('dropdownselectoper.select');

    return (
        <div className={styles.dropdownContainer}>
            <div className={styles.select} onClick={toggleDropdown}>
                <div className={styles.selectedItem}>{selectedTitle}</div>
                <div className={styles.arrow}>&#9662;</div>
            </div>

            {isOpen && (
                <ul className={styles.dropdownList}>
                    <li
                        key="null"
                        className={`${styles.dropdownItem} ${selectedValue === null ? styles.selected : ''}`}
                        onClick={() => handleSelect(null)}
                    >
                        -
                    </li>
                    {options.map((option) => (
                        <li
                            key={option.id}
                            className={`${styles.dropdownItem} ${option.id === selectedValue ? styles.selected : ''}`}
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

export default DropdownSelectOper;
