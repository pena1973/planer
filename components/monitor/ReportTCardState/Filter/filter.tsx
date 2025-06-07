import { useState } from "react";
import styles from "./filter.module.scss";
import { useTranslation } from 'react-i18next';
import { StatusEnum } from "@/types";


interface FilterComponentProps {
    getTCardsTerms: (
        useNumber: boolean,
        useDate: boolean,
        useStatus: boolean,
        tCardNumber: number,
        tCardDateFrom: string,
        tCardDateTo: string,
        tCardStatus: StatusEnum|"",
    ) => void,
    teamId: number,
    userId: number,
}

const FilterComponent: React.FC<FilterComponentProps> = (
    { getTCardsTerms,
        teamId,
        userId }
) => {
     const { t, i18n } = useTranslation();
    const [useTCardNumberFilter, setUseTCardNumberFilter] = useState(false);
    const [useTCardDateFilter, setUseTCardDateFilter] = useState(false);
    const [useTCardStatusFilter, setUseTCardStatusFilter] = useState(false);

    const [tCardNumberFilter, setTCardNumberFilter] = useState("");
    const [tCardDateFromFilter, setTCardDateFromFilter] = useState("");
    const [tCardDateToFilter, setTCardDateToFilter] = useState("");


    const [tCardStatusFilter, setTCardStatusFilter] = useState<StatusEnum | "">(""); // Поддержка пустого значения
    const [isOpen, setIsOpen] = useState(false); // Для управления открытием/закрытием списка

    // Коллекция статусов из StatusEnum
    const statuses = Object.keys(StatusEnum).map(key => ({
        value: StatusEnum[key as keyof typeof StatusEnum],  // Получаем значения из StatusEnum
        label: key.charAt(0).toUpperCase() + key.slice(1),  // Делаем первый символ заглавным
    }));

    // Открытие/закрытие выпадающего списка
    const toggleDropdown = () => setIsOpen(!isOpen);

    // Выбор значения
    const handleSelect = (value: StatusEnum | "") => {
        setTCardStatusFilter(value);
        setIsOpen(false); // Закрываем список после выбора
    };

    return (
        <div className={styles.filter_сontainer}>
            <div className={styles.table_filter}>
                <input
                    id="useTCardNumberFilter"
                    autoComplete="off"
                    checked={useTCardNumberFilter}
                    type="checkbox"
                    onChange={(e) => setUseTCardNumberFilter(!useTCardNumberFilter)}
                />
                <div className={styles.table_filter_label}>{t('reportTCardState.cardNumber')}</div>
                <input
                    className={styles.filter_input_number}
                    id="tCardNumber"
                    autoComplete="off"
                    value={tCardNumberFilter}
                    type="text"
                    onChange={(e) => setTCardNumberFilter(e.target.value)}
                // disabled={!useTCardNumberFilter}
                />
            </div>

            <div className={styles.table_filter}>
                <input
                    id="useTCardDateFilter"
                    autoComplete="off"
                    checked={useTCardDateFilter}
                    type="checkbox"
                    onChange={(e) => setUseTCardDateFilter(!useTCardDateFilter)}
                />
                <div className={styles.table_filter_label}>{t('reportTCardState.cardDateFrom')}</div>
                <input
                    className={styles.filter_input}
                    id="tCardDateFrom"
                    autoComplete="off"
                    value={tCardDateFromFilter}
                    type="date"
                    onChange={(e) => setTCardDateFromFilter(e.target.value)}
                // disabled={!useTCardDateFilter}
                />
                <div className={styles.table_filter_label}>{t('reportTCardState.cardDateTo')}</div>
                <input
                    className={styles.filter_input}
                    id="tCardDateTo"
                    autoComplete="off"
                    value={tCardDateToFilter}
                    type="date"
                    onChange={(e) => setTCardDateToFilter(e.target.value)}
                // disabled={!useTCardDateFilter}
                />
            </div>

            <div className={styles.table_filter}>
                <input
                    id="useTCardStatusFilter"
                    autoComplete="off"
                    checked={useTCardStatusFilter}
                    type="checkbox"
                    onChange={(e) => setUseTCardStatusFilter(!useTCardStatusFilter)}
                />
                <div className={styles.table_filter_label}>{t('reportTCardState.cardStatus')}</div>
              
                <div className={styles.selectContainer}>
                    <div className={styles.select} onClick={toggleDropdown}>
                        <div className={styles.selectedItem}>
                            {tCardStatusFilter ? statuses.find(status => status.value === tCardStatusFilter)?.label : t('reportTCardState.cardSelect')}
                        </div>
                        <div className={styles.arrow}>&#9662;</div>
                    </div>

                    {isOpen && (
                        <ul className={styles.dropdownList}>
                            {/* Добавляем пустой вариант для "Все" */}
                            <li
                                key=""
                                className={`${styles.dropdownItem} ${tCardStatusFilter === "" ? styles.selected : ""}`}
                                onClick={() => handleSelect("")}
                            >
                                -
                            </li>
                            {statuses.map(status => (
                                <li
                                    key={status.value}
                                    className={`${styles.dropdownItem} ${status.value === tCardStatusFilter ? styles.selected : ""}`}
                                    onClick={() => handleSelect(status.value)}
                                >
                                    {status.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>




            </div>
            <button className={styles.button_filter}
                onClick={() => getTCardsTerms( 
                    useTCardNumberFilter,
                    useTCardDateFilter,
                    useTCardStatusFilter,
                    Number(tCardNumberFilter),
                    tCardDateFromFilter,
                    tCardDateToFilter,
                    tCardStatusFilter)}
            > {t('reportTCardState.apply')}</button>
        </div>
    );
};

export default FilterComponent;

