
import styles from "./unitsCatalog.module.scss";
import { saveUnits } from '@/services/resources/saveUnits';
import { UnitItem, UnitBelongEnum, UnitTypeEnum, ActionItem, UnitActionItem, UnitExceptionItem, TimeTypeEnum } from '@/types/types';
import { generateUniqueIdc } from '@/lib/client/utils.client'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import { useEffect, useState } from "react";

import DropdownSelectBelong from "@/components/resources/UnitsCatalog/DropdownSelectBelong/dropdownSelectBelong";
import DropdownSelectType from "@/components/resources/UnitsCatalog/DropdownSelectType/dropdownSelectType";
import DropdownSelectUnitAction from "@/components/resources/UnitsCatalog/DropdownSelectUnitAction/dropdownSelectUnitAction";
import DropdownSelectTimeType from "@/components/resources/UnitsCatalog/DropdownSelectTimeType/dropdownSelectTimeType";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import { getCurrentDateInString, getTimeZoneDateFromDateString } from "@/lib/client/timezone.client"
import { useTranslation } from 'react-i18next';

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

function generateUniqueCode(units: UnitItem[]): string {
    // Находим максимальный номер из существующих кодов
    const maxCode = units.reduce((max, unit) => {
        const codeNumber = parseInt(unit.code.slice(1), 10); // Извлекаем цифры из кода, начиная с позиции 1
        return Math.max(max, codeNumber);
    }, 0);

    // Увеличиваем номер на 1
    const newCodeNumber = maxCode + 1;

    // Формируем новый код с ведущими нулями
    const newCode = `U${newCodeNumber.toString().padStart(3, '0')}`;

    return newCode;
}

export interface UnitsCatalogProps {
    setMessage: (message: string) => void
}

export default function UnitsCatalog({ setMessage }: UnitsCatalogProps) {
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();

    const token = useAppSelector((state: RootState) => {
        return state.authSlice.token;
    })

    const team = useAppSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useAppSelector((state: RootState) => {
        return state.authSlice.user;
    })
    const units = useAppSelector((state: RootState) => {
        return state.catalogSlice.units;
    })
    const actions = useAppSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })
    const unitExceptions = useAppSelector((state: RootState) => {
        return state.planSlice.unitExceptions;
    })
    const unitActions = useAppSelector((state: RootState) => {
        return state.planSlice.unitActions;
    })
    const schedule = useAppSelector((state: RootState) => {
        return state.catalogSlice.schedule;
    })

    const [unitsValue, setUnitsValue] = useState([] as UnitItem[]); //временное хранилище юнитов
    const [exceptionsValue, setExceptionsValue] = useState([] as UnitExceptionItem[]); //отклонения распиания юнитов от общего расписания
    const [unitActionsValue, setUnitActionsValue] = useState([] as UnitActionItem[]); //действия юнитов  action

    const [focusIndexUnit, setFocusIndexUnit] = useState(NaN); // Юнит на мкотором стоит курсор 
    const [buttonLoader, setButtonLoader] = useState(false);

    useEffect(() => {
        setExceptionsValue(unitExceptions)
        setUnitActionsValue(unitActions)
        setUnitsValue(units)
    }, []);


    // На клиенте    
    const deleteUnitHandler = (indexToRemove: number) => {
        const unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(indexToRemove, 1)
        setUnitsValue(unitsValueUpdated)
        setFocusIndexUnit(indexToRemove - 1);
    };
    // На клиенте
    const changeHandler = (indexToChange: number, value: string | null | UnitBelongEnum | UnitTypeEnum, field: string) => {
        const unit = unitsValue[indexToChange];
        let updatedUnit = unit;
        switch (field) {
            case "code":
                updatedUnit = { ...unit, code: value as string, modified: true }
                break;
            case "title":
                updatedUnit = { ...unit, title: value as string, modified: true }
                break;
            case "belong":
                updatedUnit = { ...unit, belong: value as UnitBelongEnum, modified: true }
                break;
            case "type":
                updatedUnit = { ...unit, type: value as UnitTypeEnum, modified: true }
                break;
            case "retool":
                updatedUnit = { ...unit, retool: Number(value), modified: true }
                break;
            case "coment":
                updatedUnit = { ...unit, coment: value as string, modified: true }
                break;
            default:
                break;
        }
        const unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(indexToChange, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)
        setFocusIndexUnit(indexToChange);
    };

    // На сервере  // На клиенте
    const saveUnitsHandler = async () => {
        setButtonLoader(true)
        setMessage("");
        let message = ""
        let exit = false;

        //  проверка на заполненность
        unitsValue.forEach((unit, index) => {

            if (!unit.code) {
                // message = message + `Заполните код юнита строка ${index + 1}!\n`;
                message = message + `${t('units.fillCode')} ${index + 1}!\n`;
                exit = true;
            }
            if (!unit.title) {
                // message = message + `Заполните название юнита строка ${index + 1}!\n`;
                message = message + `${t('units.fillTitle')} ${index + 1}!\n`;
                exit = true;
            }
            if (!unit.belong) {
                // message = message + `Заполните признак свой или сторонний юнит строка ${index + 1}!\n`;
                message = message + `${t('units.fillBelong')} ${index + 1}!\n`;
                exit = true;
            }
            if (!unit.type) {
                // message = message + `Заполните тип Юнита производство или хранение строка ${index + 1}!\n`;
                message = message + `${t('units.fillType')} ${index + 1}!\n`;
                exit = true;
            }
        })
        //  проверка на заполненность действий
        unitActionsValue.forEach((act) => {

            if (!act.action) {
                const title = unitsValue.find(unit => (!unit.id) ? unit.idc === act.unitIdc : unit.id === act.unitId)?.title;
                // message = message + `Заполните действие в списке действий юнита ${title}!\n`;
                message = message + `${t('units.fillAction')} ${title}!\n`;
                exit = true;
            }
            if (!act.koef) {
                const title = unitsValue.find(unit => (!unit.id) ? unit.idc === act.unitIdc : unit.id === act.unitId)?.title;
                // message = message + `Заполните коэфициент в списке действий юнита ${title}!\n`;
                message = message + `${t('units.fillKoef')} ${title}!\n`;
                exit = true;
            }
        })

        //  проверка на заполненность исключений
        exceptionsValue.forEach((ex) => {

            if (!ex.date) {
                const title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните дату в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillDate')} ${title}!\n`;
                exit = true;
            }
            if (!ex.timeStart) {
                const title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните время старта в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillStart')} ${title}!\n`;
                exit = true;
            }
            if (!ex.timeFinish) {
                const title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните время финиша в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillFihish')} ${title}!\n`;
                exit = true;
            }
            if (!ex.type) {
                const title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните тип времени в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillTimeType')} ${title}!\n`;
                exit = true;
            }
        })

        if (exit) {
            setButtonLoader(false);
            setMessage(message);
            return
        };
        await saveUnits(unitsValue, unitActionsValue, exceptionsValue,
            user, team, token, dispatch, t, i18n.language,
            setMessage, setUnitsValue, setUnitActionsValue, setExceptionsValue,);

        setButtonLoader(false)
    };

    // На клиенте
    const addUnitHandler = () => {
        const newUnit = {
            title: "Юнит",
            code: generateUniqueCode(unitsValue),
            retool: 15,
            modified: true,
            idc: generateUniqueIdc(),
        } as UnitItem;
        setUnitsValue([...unitsValue, newUnit])
        setFocusIndexUnit(unitsValue.length)
    };

    // Отмена изменений
    // На клиенте
    const cancelHandler = () => {
        setExceptionsValue(unitExceptions)
        setUnitActionsValue(unitActions)
        setUnitsValue(units)
    };
    // На клиенте
    function unitModified() {
        // укажу что юнит модифицирован
        const unit = unitsValue[focusIndexUnit]
        const updatedUnit = { ...unit, modified: true }
        const unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(focusIndexUnit, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)
    }

    ////////// для операций юнита
    // На клиенте
    const changeUnitActionHandler = (idToChange: number | undefined, idcToChange: number, value: number | null  | { id: number, title: string }, field: string) => {
        unitModified();
        // отклонения
        const actionsValueUpdated = [...unitActionsValue]
        let indexToChange = -1;

        if (!idToChange) {
            indexToChange = actionsValueUpdated.findIndex(elem => elem.idc === idcToChange)
            if (indexToChange < 0) return
        }
        else {
            indexToChange = actionsValueUpdated.findIndex(elem => elem.id === idToChange)
            if (indexToChange < 0) return
        }

        let unitaction = actionsValueUpdated[indexToChange];


        switch (field) {
            case "action":

                const actionValue = value as { id: number, title: string }
                const action = actions.find(elem => elem.id === actionValue.id)
                unitaction = { ...unitaction, action: (!action) ? {} as ActionItem : action }

                break;
            case "koef":
                const value_k = Number(value);
                unitaction = { ...unitaction, koef: value_k }
                break;
            default:
                break;
        }

        actionsValueUpdated.splice(indexToChange, 1, unitaction)
        setUnitActionsValue(actionsValueUpdated)
    }
    // На клиенте
    const addUnitActionHandler = () => {
        unitModified();
        const unit = unitsValue[focusIndexUnit];
        const actionsValueUpdated = [
            ...unitActionsValue,
            {
                idc: generateUniqueIdc(),
                unitId: unit.id,
                unitIdc: unit.idc,
                koef: 1.00
            } as UnitActionItem]
        setUnitActionsValue(actionsValueUpdated);
    };
    // На клиенте
    const deleteUnitActionHandler = (idToRemove: number | undefined, idcToRemove: number) => {
        unitModified();
        let indexToRemove = -1;
        if (!idToRemove) {
            indexToRemove = unitActionsValue.findIndex(elem => elem.idc === idcToRemove)
            if (indexToRemove < 0) return
        }
        else {
            indexToRemove = unitActionsValue.findIndex(elem => elem.id === idToRemove)
            if (indexToRemove < 0) return
        }
        const actionsValueUpdated = [...unitActionsValue];
        actionsValueUpdated.splice(indexToRemove, 1)
        setUnitActionsValue(actionsValueUpdated);
    };

    ///////// для отклонений расписания юнита
    // На клиенте
    const changeExceptionHandler = (idToChange: number | undefined, idcToChange: number, value: string | number | null | TimeTypeEnum, field: string) => {
        unitModified();

        const exceptionsValueUpdated = [...exceptionsValue]
        let indexToChange = -1;

        if (!idToChange) {
            indexToChange = exceptionsValueUpdated.findIndex(elem => elem.idc === idcToChange)
            if (indexToChange < 0) return
        }
        else {
            indexToChange = exceptionsValueUpdated.findIndex(elem => elem.idc === idcToChange)
            if (indexToChange < 0) return
        }

        let exception = exceptionsValueUpdated[indexToChange];

        switch (field) {
            case "date":
                exception = { ...exception, date: value as string }
                break
            case "timeType":
                exception = { ...exception, type: value as TimeTypeEnum }
                break;
            case "timeStart":
                exception = { ...exception, timeStart: value as number }
                break
            case "timeFinish":
                exception = { ...exception, timeFinish: value as number }
                break;
            default:
                break;
        }

        exceptionsValueUpdated.splice(indexToChange, 1, exception)
        setExceptionsValue(exceptionsValueUpdated)
    }
    // На клиенте
    const addExceptionHandler = () => {
        unitModified();
        const todayStr = getCurrentDateInString(schedule.timeZone);
        const unit = unitsValue[focusIndexUnit];
        // const exceptionsValueUpdated = [...exceptionsValue, { idc: generateUniqueIdc(), unitId: unit.id, unitIdc: unit.idc, date: new Date().toLocaleDateString("en-CA") } as UnitExceptionItem]
        const exceptionsValueUpdated = [...exceptionsValue, { idc: generateUniqueIdc(), unitId: unit.id, unitIdc: unit.idc, date: todayStr } as UnitExceptionItem]
        setExceptionsValue(exceptionsValueUpdated);
    };
    // На клиенте
    const deleteExceptionHandler = (idToRemove: number | undefined, idcToRemove: number) => {
        unitModified();
        let indexToRemove = -1;
        if (!idToRemove) {
            indexToRemove = exceptionsValue.findIndex(elem => elem.idc === idcToRemove)
            if (indexToRemove < 0) return
        }
        else {
            indexToRemove = exceptionsValue.findIndex(elem => elem.id === idToRemove)
            if (indexToRemove < 0) return
        }
        const exceptionsValueUpdated = [...exceptionsValue];
        exceptionsValueUpdated.splice(indexToRemove, 1)
        setExceptionsValue(exceptionsValueUpdated);
    };

    // Юниты
    const unitsValueReactNodes = unitsValue.map((elem, index) => (
        <tr key={index}>

            <td>
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                    onClick={() => deleteUnitHandler(index)}
                    onFocus={() => setFocusIndexUnit(index)}
                />
            </td>
            <td>
                <input
                    className={styles.units_code}
                    id={`code-${index}`}
                    autoComplete="off"
                    value={elem.code || ""}
                    type="text"
                    onChange={e => {
                        changeHandler(index, e.target.value, "code");
                    }}
                    onFocus={() => setFocusIndexUnit(index)}
                />

            </td>
            <td>
                <input
                    className={styles.units_title}
                    id={`title-${index}`}
                    autoComplete="off"
                    value={elem.title}
                    type="text"
                    onChange={e => {
                        changeHandler(index, e.target.value, "title");
                    }}
                    onFocus={() => setFocusIndexUnit(index)}
                />
            </td>
            <td>

                <DropdownSelectBelong
                    onSelect={(value) => { changeHandler(index, value, "belong"); }}
                    selectedValue={elem.belong || null}
                />
            </td>
            <td>
                <input
                    className={styles.units_retool}
                    id={`retool-${index}`}
                    type="text"
                    autoComplete="off"
                    value={elem.retool ?? ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        // Разрешаем только цифры
                        const v = e.target.value.replace(/\D+/g, "");
                        changeHandler(index, v, "retool");
                    }}
                    onBlur={() => {
                        // гарантируем строку
                        const rawStr = String(elem.retool ?? "");

                        // если пусто — оставляем пусто
                        if (rawStr === "") return;

                        // нормализуем и ограничиваем диапазон
                        const n = Number(rawStr); // уберёт ведущие нули
                        const clamped = Math.max(0, Math.min(2147483647, Number.isFinite(n) ? n : 0));

                        // отдаём строку
                        changeHandler(index, String(clamped), "retool");
                    }}

                    onFocus={() => setFocusIndexUnit(index)}
                />

            </td>
            <td>
                <DropdownSelectType
                    onSelect={(value) => { changeHandler(index, value, "type"); }}
                    selectedValue={elem.type || null}
                />
            </td>
            <td>
                <input
                    className={styles.units_coment}
                    id={`coment-${index}`}
                    autoComplete="off"
                    value={elem.coment || ""}
                    type="text"
                    onChange={e => {
                        changeHandler(index, e.target.value, "coment");
                    }}
                    onFocus={() =>
                        setFocusIndexUnit(index)
                    }
                />
                {elem.modified && <div className={styles.point}>*</div>}
            </td>
        </tr>
    ))

    // Исключения
    const unitFocusExceptionsValueReactNodes = exceptionsValue
        .filter(elem => elem.unitIdc === unitsValue[focusIndexUnit]?.idc)
        .map((elem, index) => (

            <tr key={"ex" + index}>
                <td>
                    <Image
                        // className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteExceptionHandler(elem.id, elem.idc)}
                    />
                </td>
                <td>
                    <input
                        id={`date-${elem.id}`}
                        autoComplete="off"
                        value={elem.date ? (new Date(elem.date)).toLocaleDateString('en-CA') : ""}
                        type="date"
                        onChange={e => {
                            changeExceptionHandler(elem.id, elem.idc, e.target.value, "date");
                        }}
                    />
                </td>
                <td>
                    <input
                        id={`timeStart-${elem.id}`}
                        autoComplete="off"
                        value={elem.timeStart !== undefined
                            ? `${String(Math.floor(elem.timeStart / 60)).padStart(2, '0')}:${String(elem.timeStart % 60).padStart(2, '0')}`
                            : ""}
                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeExceptionHandler(elem.id, elem.idc, totalMinutes, "timeStart");
                        }}
                    />
                </td>
                <td>
                    <input
                        id={`timeFinish-${elem.id}`}
                        autoComplete="off"
                        value={elem.timeFinish !== undefined
                            ? `${String(Math.floor(elem.timeFinish / 60)).padStart(2, '0')}:${String(elem.timeFinish % 60).padStart(2, '0')}`
                            : ""}

                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeExceptionHandler(elem.id, elem.idc, totalMinutes, "timeFinish");
                        }}
                    />
                </td>
                <td>

                    <DropdownSelectTimeType
                        onSelect={(value) => { changeExceptionHandler(elem.id, elem.idc, value, "timeType"); }}
                        selectedValue={elem.type || null}
                    />
                </td>
            </tr>
        )

        )

    // Действия которые уже выбраны в списоке юнита
    const selectedValues = (unitActionsValue || [])
        .filter(elem => elem.unitIdc === unitsValue[focusIndexUnit]?.idc)
        .map((elem) =>
            elem.action?.id
        )
    // Действия
    const unitFocusActionValueReactNodes = (unitActionsValue || [])
        .filter(elem => elem.unitIdc === unitsValue[focusIndexUnit]?.idc)
        .map((elem, index) => {
            console.log(elem);
            return (
                <tr key={"ac" + index}>
                    <td>
                        <Image
                            src={del} alt="del" width={20} height={20}
                            onClick={() => deleteUnitActionHandler(elem.id, elem.idc)}
                        />
                    </td>
                    <td>
                        <DropdownSelectUnitAction
                            options={actions}
                            onSelect={(value) => { changeUnitActionHandler(elem.id, elem.idc, value, "action"); }}
                            selectedValue={elem.action?.id || null}
                            selectedValues={selectedValues}  // Передаем массив выбранных Значений
                        />
                    </td>
                    <td>
                        <input
                            className={styles.unit_koef}
                            id={`koef-${index}`}
                            type="text"
                            inputMode="decimal"
                            pattern="^\\d*(?:[,.]\\d{0,2})?$"
                            // Ничего не пишем в стор во время набора — поле "само по себе"
                            defaultValue={elem.koef == null ? '' : Number(elem.koef).toFixed(2).replace('.', ',')}
                            onBlur={(e) => {
                                const raw = (e.currentTarget.value || '').trim();
                                // Пусто → передаём 0 и показываем "0,00"
                                if (raw === '') {
                                    changeUnitActionHandler(elem.id, elem.idc, 0, 'koef');
                                    e.currentTarget.value = '0,00';
                                    return;
                                }

                                // Нормализация: ','→'.', clamp [0..2147483647], округление до 2 знаков
                                const n = Number(raw.replace(',', '.'));
                                if (!Number.isFinite(n)) {
                                    changeUnitActionHandler(elem.id, elem.idc, 0, 'koef');
                                    e.currentTarget.value = '0,00';
                                    return;
                                }

                                const clamped = Math.min(2147483647, Math.max(0, n));
                                const rounded = Math.round(clamped * 100) / 100;

                                // В стор — NUMBER; в поле — "NNN,NN"
                                changeUnitActionHandler(elem.id, elem.idc, rounded, 'koef');
                                e.currentTarget.value = rounded.toFixed(2).replace('.', ',');
                            }}
                        />
                    </td>
                </tr>
            )
        }

        )

    return (
        <div className={styles.units}>
            <div className={`${styles.contaitainer_catalog_left} ${styles.container} ${styles._units}`}>
                <Image className={styles.icon_cancel}
                    src={cancel}
                    alt="arrow"
                    width={24} height={24}
                    onClick={() => { cancelHandler() }}
                />
                {/* Шапка таблицы */}
                <table className={styles._table}>
                    <thead>
                        <tr>
                            <th></th>
                            <th>{t('units.Code')}</th>
                            <th>{t('units.Name')}</th>
                            <th>{t('units.Whoos')}</th>
                            <th>{t('units.Retool')}</th>
                            <th>{t('units.Type')}</th>
                            <th>{t('units.Coment')}</th>

                        </tr>
                    </thead>
                    <tbody>
                        {unitsValueReactNodes}
                    </tbody>
                </table>

                <div className={styles.container_buttons_row}>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addUnitHandler() }}
                        />
                    </div>
                    <div className={styles.container_icon_edit_save}>
                        {buttonLoader && <ButtonLoader />}
                        {!buttonLoader &&
                            <Image className={styles.icon_edit_save}
                                src={save}
                                alt="arrow" width={20} height={20}
                                onClick={() => { saveUnitsHandler() }}
                            />}
                    </div>
                </div>


            </div>

            {(focusIndexUnit >= 0) &&
                <div className={styles.contaitainer_catalog_right}>
                    <div>
                        <div className="catalog_title">{t('units.UnitActions')} {unitsValue[focusIndexUnit].title}</div>
                        {/* <div className={styles.container_unit_actions}> */}
                        <div className={`${styles.container} ${styles._unit_actions}`}>
                            <table className={styles._table_a}>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>{t('units.ActionTitle')}</th>
                                        <th>{t('units.ActionKoef')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unitFocusActionValueReactNodes}
                                </tbody>
                            </table>
                            <div className={styles.container_buttons_row}>

                                <div className={styles.container_icon_edit_save}>
                                    <Image className={styles.icon_edit_save}
                                        src={add}
                                        alt="arrow" width={20} height={20}
                                        onClick={() => { addUnitActionHandler() }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="catalog_title">{t('units.ExTitle')}</div>
                        <div className={`${styles.container} ${styles._unit_exceptions}`}>
                            {/* <div className={styles.container_unit_exceptions}> */}
                            <table className={styles._table_e}>
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>{t('units.ExDate')}</th>
                                        <th>{t('units.ExStart')}</th>
                                        <th>{t('units.ExFinish')}</th>
                                        <th>{t('units.ExTimeType')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {unitFocusExceptionsValueReactNodes}
                                </tbody>
                            </table>
                            <div className={styles.container_buttons_row}>
                                <div className={styles.container_icon_edit_save}>

                                    <Image className={styles.icon_edit_save}
                                        src={add}
                                        alt="arrow" width={20} height={20}
                                        onClick={() => { addExceptionHandler() }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>}
        </div >

    )
}