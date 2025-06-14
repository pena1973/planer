
import styles from "./unitsCatalog.module.scss";
import { UnitItem, UnitBelongEnum, UnitTypeEnum, ActionItem, UnitActionItem, UnitExceptionItem, TimeTypeEnum } from '@/types';
import { generateUniqueIdc } from '@/utils'
import ButtonLoader from "@/components/ButtonLoader/buttonLoader";

import Image from 'next/image';
import { useEffect, useState } from "react";

import DropdownSelectBelong from "@/components/resources/UnitsCatalog/DropdownSelectBelong/dropdownSelectBelong";
import DropdownSelectType from "@/components/resources/UnitsCatalog/DropdownSelectType/dropdownSelectType";
import DropdownSelectUnitAction from "@/components/resources/UnitsCatalog/DropdownSelectUnitAction/dropdownSelectUnitAction";
import DropdownSelectTimeType from "@/components/resources/UnitsCatalog/DropdownSelectTimeType/dropdownSelectTimeType";

import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import { setUnits, setUnitExceptions, setUnitActions } from '@/store/slices'

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

    const token = useSelector((state: RootState) => {
        return state.authSlice.token;
    })

    const team = useSelector((state: RootState) => {
        return state.catalogSlice.team;
    })

    const user = useSelector((state: RootState) => {
        return state.authSlice.user;
    })
    const units = useSelector((state: RootState) => {
        return state.catalogSlice.units;
    })
    const actions = useSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })
    const unitExceptions = useSelector((state: RootState) => {
        return state.planSlice.unitExceptions;
    })
    const unitActions = useSelector((state: RootState) => {
        return state.planSlice.unitActions;
    })
    const [unitsValue, setUnitsValue] = useState([] as UnitItem[]); //временное хранилище юнитов
    const [exceptionsValue, setExceptionsValue] = useState([] as UnitExceptionItem[]); //отклонения распиания юнитов от общего расписания
    const [actionsValue, setActionsValue] = useState([] as UnitActionItem[]); //действия юнитов

    // const [message, setMessage] = useState("");
    const [focusIndexUnit, setFocusIndexUnit] = useState(NaN); // Юнит на мкотором стоит курсор 

    const [buttonLoader, setButtonLoader] = useState(false);

    useEffect(() => {
        setExceptionsValue(unitExceptions)
        setActionsValue(unitActions)
        setUnitsValue(units)
    }, []);

    // Таблица Юнитов   
    const deleteUnitHandler = (indexToRemove: number) => {
        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(indexToRemove, 1)
        setUnitsValue(unitsValueUpdated)
        setFocusIndexUnit(indexToRemove - 1);
    };
    const changeHandler = (indexToChange: number, value: string | null | UnitBelongEnum | UnitTypeEnum, field: string) => {
        let unit = unitsValue[indexToChange];
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
        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(indexToChange, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)
        setFocusIndexUnit(indexToChange);
    };

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
        actionsValue.forEach((act) => {

            if (!act.action) {
                let title = unitsValue.find(unit => (!unit.id) ? unit.idc === act.unitIdc : unit.id === act.unitId)?.title;
                // message = message + `Заполните действие в списке действий юнита ${title}!\n`;
                message = message + `${t('units.fillAction')} ${title}!\n`;
                exit = true;
            }
            if (!act.koef) {
                let title = unitsValue.find(unit => (!unit.id) ? unit.idc === act.unitIdc : unit.id === act.unitId)?.title;
                // message = message + `Заполните коэфициент в списке действий юнита ${title}!\n`;
                message = message + `${t('units.fillKoef')} ${title}!\n`;
                exit = true;
            }
        })

        //  проверка на заполненность исключений
        exceptionsValue.forEach((ex) => {

            if (!ex.date) {
                let title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните дату в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillDate')} ${title}!\n`;
                exit = true;
            }
            if (!ex.timeStart) {
                let title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните время старта в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillStart')} ${title}!\n`;
                exit = true;
            }
            if (!ex.timeFinish) {
                let title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните время финиша в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillFihish')} ${title}!\n`;
                exit = true;
            }
            if (!ex.type) {
                let title = unitsValue.find(unit => (!unit.id) ? unit.idc === ex.unitIdc : unit.id === ex.unitId)?.title;
                // message = message + `Заполните тип времени в списке отклонений расписания юнита ${title}!\n`;
                message = message + `${t('units.fillTimeType')} ${title}!\n`;
                exit = true;
            }
        })

        if (exit) {
            setMessage(message);
            return
        };

        // запрос на сохранение
        try {

            const res = await fetch(`api/units-api`,
                {
                    method: 'post',
                    headers: new Headers({
                        'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        userId: user.id,
                        teamId: team.id,
                        units: unitsValue,
                        actions: actionsValue,
                        exceptions: exceptionsValue
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                let error = receivedData.error;
                // setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                setMessage(t('service.serverUnavailable') + error);
            } else {
                const receivedData = await res.json();
                // console.log("receivedData", receivedData)
                // setMessage(receivedData.error);
                if (receivedData.success) {
                    //   Обновим список юнитов
                    let units_ = receivedData.units as UnitItem[]
                    units_.sort((a, b) => {
                        // Проверка на undefined
                        const idA = a.id ?? 0; // Если id a не существует, считаем его 0
                        const idB = b.id ?? 0; // Если id b не существует, считаем его 0          
                        return idA - idB; // Сравниваем id
                    });

                    let exceptions_ = receivedData.exceptions as UnitExceptionItem[]
                    let actions_ = receivedData.actions as UnitActionItem[]
                    // временное хранилище                  
                    setUnitsValue(units_);
                    // сеансовое хранилище                  
                    dispatch(setUnits(units_));
                    // отклонения                    
                    setExceptionsValue(exceptions_)
                    dispatch(setUnitExceptions(exceptions_));
                    // отклонения                    
                    setActionsValue(actions_)
                    dispatch(setUnitActions(actions_));
                    setMessage(receivedData.error)
                    // setMessage("Обновлен список юнитов, их действий и отклонений расписания");
                    setMessage(t('units.unitsUpdated'));
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            setMessage(t('service.serverUnavailable') + e.message)
        }

        setButtonLoader(false)
    };
    const addUnitHandler = () => {
        let newUnit = {
            title: "Юнит",
            code: generateUniqueCode(unitsValue),
            retool: 1,
            modified: true,
            idc: generateUniqueIdc(),
            // actions: [] as { action: ActionItem, koef: number }[],
        } as UnitItem;
        setUnitsValue([...unitsValue, newUnit])
        setFocusIndexUnit(unitsValue.length)
    };

    // Отмена изменений
    const cancelHandler = () => {
        setExceptionsValue(unitExceptions)
        setActionsValue(unitActions)
        setUnitsValue(units)
    };

    function unitModified() {
        // укажу что юнит модифицирован
        let unit = unitsValue[focusIndexUnit]
        let updatedUnit = { ...unit, modified: true }
        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(focusIndexUnit, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)
    }

    // для операций юнита
    const changeUnitActionHandler = (idToChange: number | undefined, idcToChange: number, value: number | null | { id: number, title: string }, field: string) => {
        unitModified();
        // отклонения
        let actionsValueUpdated = [...actionsValue]
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
                const value_k = value as number;
                unitaction = { ...unitaction, koef: value_k }
                break;
            default:
                break;
        }

        actionsValueUpdated.splice(indexToChange, 1, unitaction)
        setActionsValue(actionsValueUpdated)
    }
    const addUnitActionHandler = () => {
        unitModified();
        let unit = unitsValue[focusIndexUnit];
        let actionsValueUpdated = [...actionsValue, { idc: generateUniqueIdc(), unitId: unit.id, unitIdc: unit.idc, koef: 1 } as UnitActionItem]
        setActionsValue(actionsValueUpdated);
    };
    const deleteUnitActionHandler = (idToRemove: number | undefined, idcToRemove: number) => {
        unitModified();
        let indexToRemove = -1;
        if (!idToRemove) {
            indexToRemove = actionsValue.findIndex(elem => elem.idc === idcToRemove)
            if (indexToRemove < 0) return
        }
        else {
            indexToRemove = actionsValue.findIndex(elem => elem.id === idToRemove)
            if (indexToRemove < 0) return
        }
        let actionsValueUpdated = [...actionsValue];
        actionsValueUpdated.splice(indexToRemove, 1)
        setActionsValue(actionsValueUpdated);
    };

    // для отклонений расписания юнита
    const changeExceptionHandler = (idToChange: number | undefined, idcToChange: number, value: string | number | null | TimeTypeEnum, field: string) => {
        unitModified();


        // отклонения
        let exceptionsValueUpdated = [...exceptionsValue]
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
    const addExceptionHandler = () => {
        unitModified();
        let unit = unitsValue[focusIndexUnit];
        let exceptionsValueUpdated = [...exceptionsValue, { idc: generateUniqueIdc(), unitId: unit.id, unitIdc: unit.idc, date: new Date().toLocaleDateString("en-CA") } as UnitExceptionItem]
        setExceptionsValue(exceptionsValueUpdated);
    };
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
        let exceptionsValueUpdated = [...exceptionsValue];
        exceptionsValueUpdated.splice(indexToRemove, 1)
        setExceptionsValue(exceptionsValueUpdated);
    };

    // Юниты
    let unitsValueReactNodes = unitsValue.map((elem, index) => (
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
                    autoComplete="off"
                    value={elem.retool}
                    type="number"
                    max={2147483647}
                    min={0}
                    onChange={e => {
                        const value = e.target.value;
                        if (/^\d*$/.test(value)) {
                            changeHandler(index, e.target.value, "retool");
                        }
                    }}
                    onFocus={() => setFocusIndexUnit(index)}
                />
            </td>
            <td>
                <DropdownSelectType
                    onSelect={(value) => { changeHandler(index, String(value), "type"); }}
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
    let unitFocusExceptionsValueReactNodes = exceptionsValue
        .filter(elem => elem.unitId === unitsValue[focusIndexUnit]?.id)
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
                        // className={styles.exception_date}
                        id={`date-${elem.id}`}
                        autoComplete="off"
                        value={elem.date ? (new Date(elem.date)).toLocaleDateString('en-CA') : ""}
                        type="date"
                        onChange={e => {
                            const date = new Date(e.target.value);
                            date.setHours(0, 0, 0, 0);
                            changeExceptionHandler(elem.id, elem.idc, date.toLocaleDateString("en-CA"), "date");
                        }}
                    />
                </td>
                <td>
                    <input
                        // className={styles.exception_time}
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
                        // className={styles.exception_time}
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

    let selectedValues = (actionsValue || [])
        .filter(elem => elem.unitId === unitsValue[focusIndexUnit]?.id)
        .map((elem) =>
            elem.action?.id)

    let unitFocusActionValueReactNodes = (actionsValue || [])
        .filter(elem => elem.unitId === unitsValue[focusIndexUnit]?.id)
        .map((elem, index) => (
            (
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
                            // autoComplete="off"
                            value={elem.koef}
                            type="number"
                            step="0.01"
                            max={2147483647}
                            min={0}
                            onChange={e => {
                                const value = e.target.value;
                                if (/^\d*(,|\.)?\d{0,2}?$/.test(value)) {
                                    changeUnitActionHandler(elem.id, elem.idc, Number(e.target.value), "koef");
                                }
                            }}
                        />
                    </td>
                </tr>
            )
        ))

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