import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './dropdownSelectTeam.module.scss';
import { TeamItem } from '@/types/types';
import { generateTeamNumber } from '@/lib/client/utils.client'

interface DropdownSelectTeamProps {
    options: TeamItem[];
    onSelect: (option: TeamItem | null) => void;
    selectedValue: number | null;
}

const DropdownSelectTeam: React.FC<DropdownSelectTeamProps> = ({
    options,
    onSelect,
    selectedValue,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const toggleDropdown = () => setIsOpen(v => !v);

    const handleSelect = (option: TeamItem | null) => {
        onSelect(option);
        setIsOpen(false);
    };

    const selectedTitle = useMemo(() => {
        if (selectedValue === null) return '-';
        const team = options.find(opt => opt.id === selectedValue);
        if (!team) return '-';
        return `${team.title} (${generateTeamNumber(team.prefix, team.id)})`;
    }, [options, selectedValue]);

    // ✅ закрытие при клике вне
    useEffect(() => {
        if (!isOpen) return;

        const onPointerDown = (e: PointerEvent) => {
            const root = rootRef.current;
            if (!root) return;
            if (!root.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [isOpen]);

    return (
        <div ref={rootRef} className={styles.dropdownContainer}>
            <div className={styles.select} onClick={toggleDropdown}>
                <div className={styles.selectedItem}>{selectedTitle}</div>
                <div className={styles.arrow}>&#9662;</div>
            </div>

            {isOpen && (
                <ul className={styles.dropdownList}>
                    <li
                        key="__empty__"
                        className={`${styles.dropdownItem} ${selectedValue === null ? styles.selected : ''}`}
                        onClick={() => handleSelect(null)}
                    >
                        -
                    </li>

                    {options.map(option => (
                        <li
                            key={option.id}
                            className={`${styles.dropdownItem} ${option.id === selectedValue ? styles.selected : ''}`}
                            onClick={() => handleSelect(option)}
                        >
                            {`${option.title} (${generateTeamNumber(option.prefix, option.id)})`}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default DropdownSelectTeam;
