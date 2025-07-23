

import React, { useState } from 'react';
import styles from './dropdownSelectProduct.module.scss';

interface Option {
  idc: number;
  title: string;
}

interface DropdownSelectProductProps {
  options: Option[];
  onSelect: (option: Option | null) => void;
  selectedValue: number | null;
  width?: string
}

const DropdownSelectProduct: React.FC<DropdownSelectProductProps> = ({
  options,
  onSelect,
  selectedValue,
  width = "150", 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (option: Option | null) => {
    onSelect(option);
    setIsOpen(false);
  };

  const selectedTitle =
    selectedValue !== null
      ? options.find(opt => opt.idc === selectedValue)?.title || 'Выберите'
      : 'Выберите';

  return (
    <div className={styles.dropdownContainer} style={{ maxWidth:` ${width}` }}>
      <div className={styles.select} onClick={toggleDropdown}>
        <div className={styles.selectedItem}>{selectedTitle}</div>
        <div className={styles.arrow}>▾</div>
      </div>

      {isOpen && (
        <ul className={styles.dropdownList}>
          <li
            key="null"
            className={`${styles.dropdownItem} ${selectedValue === null ? styles.selected : ''
              }`}
            onClick={() => handleSelect(null)}
          >
            -
          </li>
          {options.map(option => (
            <li
              key={option.idc}
              className={`${styles.dropdownItem} ${option.idc === selectedValue ? styles.selected : ''
                }`}
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

export default DropdownSelectProduct;
