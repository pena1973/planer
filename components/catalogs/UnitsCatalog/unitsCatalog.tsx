
import styles from "./unitsCatalog.module.scss";
import { UnitItem, UnitBelongEnum, UnitTypeEnum, ActionItem, UnitActionItem, UnitExceptionItem, TimeTypeEnum } from '@/types'
import Image from 'next/image';
import { useEffect, useState, useRef } from "react";

import DropdownSelectBelong from "@/components/catalogs/UnitsCatalog/DropdownSelectBelong/dropdownSelectBelong";
import DropdownSelectType from "@/components/catalogs/UnitsCatalog/DropdownSelectType/dropdownSelectType";
import DropdownSelectUnitAction from "@/components/catalogs/UnitsCatalog/DropdownSelectUnitAction/dropdownSelectUnitAction";
import DropdownSelectTimeType from "@/components/catalogs/UnitsCatalog/DropdownSelectTimeType/dropdownSelectTimeType";

import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";

import { setUnits, setUnitExceptions } from '@/store/slices'
const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import cancel from "@/public/cancel.png";
import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";


function generateUniqueId(): number {
    const timestamp = Date.now(); // Получаем текущее время в миллисекундах
    const randomFactor = Math.floor(Math.random() * 1000); // Добавляем случайное число для уникальности
    return timestamp + randomFactor;
}

export interface UOMSCatalogProps {
    setMessage: (message: string) => void
}

export default function UOMSCatalog({ setMessage }: UOMSCatalogProps) {
    const dispatch = useAppDispatch();

    const units = useSelector((state: RootState) => {
        return state.catalogSlice.units;
    })
    const actions = useSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })

    const [unitsValue, setUnitsValue] = useState([] as UnitItem[]); //временное хранилище юнитов
    const [exceptionsValue, setExceptionsValue] = useState([] as UnitExceptionItem[]); //отклонения распиания юнитов от общего расписания

    // const [message, setMessage] = useState("");
    const [focusIndexUnit, setFocusIndexUnit] = useState(NaN); // Юнит на мкотором стоит курсор

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
    const getUnits = async () => {
        // Загружаем классификатор действий
        try {
            const res = await fetch(`api/units-api?userId=${1}&companyId=${1}`,
                {
                    method: 'get',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                let error = receivedData.error;
                setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                // setMessage(t('service.serverUnavailable') + res.status);

            } else {
                const receivedData = await res.json();
                if (receivedData.success) {
                    let units_ = receivedData.units as UnitItem[]
                    dispatch(setUnits(units_)); // Это ме надо?
                    setUnitsValue(units_);
                }
                else setMessage(receivedData.error);
            }
        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }

    }
    const getUnutsExceptions = async () => {
        // Загружаем классификатор действий
        try {
            const res = await fetch(`api/exceptions-api?userId=${1}&companyId=${1}`,
                {
                    method: 'get',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                let error = receivedData.error;
                setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                // setMessage(t('service.serverUnavailable') + res.status);

            } else {
                const receivedData = await res.json();
                if (receivedData.success) {
                    let exceptions = receivedData.exceptions as UnitExceptionItem[]
                    dispatch(setUnitExceptions(exceptions)); // Это ме надо?
                    setExceptionsValue(exceptions);
                }
                else setMessage(receivedData.error);
            }
        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }

    }
    useEffect(() => {
        getUnits();
        getUnutsExceptions()
    }, []);

    // Таблица Юнитов   
    const deleteUnitHandler = (indexToRemove: number) => {
        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(indexToRemove, 1)
        setUnitsValue(unitsValueUpdated)
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

    const saveUnitHandler = async (index: number) => {
        setMessage("");

        let unit = unitsValue[index];
        let unitEx = exceptionsValue.filter(elem => elem.unitId === unit.id)

        if (!unit.code) {
            setMessage(`Заполните код производственного центра строка ${index + 1}!`);
            return;
        }
        if (!unit.title) {
            setMessage("Заполните название действия строка ${index+1}!!");
            return;
        }
        if (!unit.retool) {
            setMessage("Заполните время на переналадку между операциями строка ${index+1}!!");
            return;
        }
        if (!unit.belong) {
            setMessage("Заполните признак свой или сторонний юнит строка ${index+1}!!");
            return;
        }
        if (!unit.type) {
            setMessage("Заполните тип Юнита производство или хранение строка ${index+1}!!");
            return;
        }
        // запрос на сохранение
        try {

            // запрос получение текста из БД вместе со словами     textId: number, userId:number
            const res = await fetch(`api/unit-api?userId=${1}&companyId=${1}`,
                {
                    method: 'post',
                    headers: new Headers({
                        // 'Authorization': 'Basic ' + token,
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify({
                        unit: unit,
                        exceptions: unitEx
                    }),
                }
            );
            if (res.status !== 200) {
                const receivedData = await res.json();
                let error = receivedData.error;
                setMessage(error);
                //  console.log(t('service.serverUnavailable') + res.status);
                // setMessage(t('service.serverUnavailable') + res.status);
            } else {
                const receivedData = await res.json();
                // console.log("receivedData", receivedData)
                // setMessage(receivedData.error);
                if (receivedData.success) {
                    //   Обновим текущую карту
                    let unit = receivedData.unit as UnitItem
                    let exceptions = receivedData.exceptions as UnitExceptionItem[]
                    // временное хранилище
                    let updatedUnits = [...unitsValue];
                    updatedUnits.splice(index, 1, unit);
                    setUnitsValue(updatedUnits);

                    // сеансовое хранилище
                    updatedUnits = [...units];
                    updatedUnits.splice(index, 1, unit);
                    dispatch(setUnits(updatedUnits));
                    // отклонения
                    // Убираем все элементы с указанным unit
                    let updatetExceptions = exceptionsValue.filter(exception => exception.unitId !== unit.id)
                    // добавляем сохраненные
                    setExceptionsValue([...updatetExceptions, ...exceptions])
                } else setMessage(receivedData.error);
            }

        } catch (e: any) {
            // setMessage(t('service.noConnection') + e.message)            
        }


    };

    const addUnitHandler = () => {
        let newUnit = {
            title: "Юнит",
            code: generateUniqueCode(unitsValue),
            retool: 1,
            modified: true,
            actions: [] as { action: ActionItem, koef: number }[],
        } as UnitItem;
        setUnitsValue([...unitsValue, newUnit])
        setFocusIndexUnit(unitsValue.length)
    };
    const cancelUnitHandler = (indexToCancel: number) => {
        let id = unitsValue[indexToCancel].id;
        let canceledUnit = units.find(elem => elem.id === id);

        if (canceledUnit!)
            canceledUnit = {
                title: "Юнит",
                code: generateUniqueCode(unitsValue),
                retool: 1,
                modified: true,
                actions: [] as { action: ActionItem, koef: number }[],
            } as UnitItem;


        if (canceledUnit) {
            let unitsValueUpdated = [...unitsValue]
            unitsValueUpdated.splice(indexToCancel, 1, canceledUnit)
            setUnitsValue(unitsValueUpdated)
            setFocusIndexUnit(indexToCancel);
        };
    }
    // для операций юнита
    const changeUnitActionHandler = (indexToChange: number, value: number | null | { id: number, title: string }, field: string) => {
        let unit = unitsValue[focusIndexUnit]
        let updatedUnit = unit;
        let updatedActions = [...unit.actions];
        let u_action = unit.actions[indexToChange] as { id?: number, action: ActionItem, koef: number };
        let updated_u_action = { ...u_action }

        switch (field) {
            case "action":

                const actionValue = value as { id: number, title: string }
                const action = actions.find(elem => elem.id === actionValue.id)
                updated_u_action = { ...u_action, action: (!action) ? {} as ActionItem : action }
                break;
            case "koef":
                const value_k = value as number;
                updated_u_action = { ...u_action, koef: value_k }
                break;
            default:
                break;
        }

        updatedActions.splice(indexToChange, 1, updated_u_action)
        updatedUnit = { ...unit, actions: updatedActions, modified: true }
        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(focusIndexUnit, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)

    }
    const addUnitActionHandler = () => {
        let unit = unitsValue[focusIndexUnit];
        let actions = [...unit.actions, { action: {} as ActionItem, koef: 1 } as UnitActionItem]
        let updatedUnit = { ...unit, actions: actions };
        let unitsValueUpdated = [...unitsValue];
        unitsValueUpdated.splice(focusIndexUnit, 1, updatedUnit);
        setUnitsValue(unitsValueUpdated);
    };
    const deleteUnitActionHandler = (indexToRemove: number) => {
        let actionsUpdated = [...unitsValue[focusIndexUnit].actions];
        actionsUpdated.splice(indexToRemove, 1)

        let updatedUnit = { ...unitsValue[focusIndexUnit], actions: actionsUpdated, modified: true };

        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(focusIndexUnit, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)

    };

    // для отклонений расписания юнита
    const changeExceptionHandler = (idToChange: number, value: string | number | null |  TimeTypeEnum, field: string) => {

        // укажу что юнит модифицирован
        let unit = unitsValue[focusIndexUnit]
        let updatedUnit = { ...unit, modified: true }
        let unitsValueUpdated = [...unitsValue]
        unitsValueUpdated.splice(focusIndexUnit, 1, updatedUnit)
        setUnitsValue(unitsValueUpdated)

        // отклонения
        let exceptionsValueUpdated = [...exceptionsValue]
        let indexToChange = exceptionsValueUpdated.findIndex(elem => elem.id === idToChange)

        if (indexToChange < 0) return

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
        const id = generateUniqueId();

        let unit = unitsValue[focusIndexUnit];
        let exceptionsValueUpdated = [...exceptionsValue, { id: id, unitId: unit.id, date: new Date().toLocaleDateString("en-CA") } as UnitExceptionItem]
        setExceptionsValue(exceptionsValueUpdated);
    };
    const deleteExceptionHandler = (idToRemove: number) => {
        let indexToRemove = exceptionsValue.findIndex(elem => elem.id === idToRemove)
        if (indexToRemove < 0) return

        let exceptionsValueUpdated = [...exceptionsValue];
        exceptionsValueUpdated.splice(indexToRemove, 1)
        setExceptionsValue(exceptionsValueUpdated);
    };

    let unitsValueReactNodes = unitsValue.map((elem, index) => (
        <tr key={index}>
            <td>
                <Image className={styles.icon_del}
                    src={cancel}
                    alt="cancel" width={20} height={20}
                    onClick={() => { cancelUnitHandler(index) }}
                />
            </td>
            <td>
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                    onClick={() => deleteUnitHandler(index)}
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
            </td>
            <td>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => { saveUnitHandler(index) }}
                    />
                    {elem.modified && <div>*</div>}
                </div>
            </td>
        </tr>
    ))

    let unitFocusExceptionsValueReactNodes = exceptionsValue
        .filter(elem => elem.unitId === unitsValue[focusIndexUnit]?.id)
        .map((elem) => (

            <tr key={elem.id}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteExceptionHandler(elem.id)}
                    />
                </td>
                <td>
                    <input
                        className={styles.exception_date}
                        id={`date-${elem.id}`}
                        autoComplete="off"
                        value={elem.date ? (new Date(elem.date)).toLocaleDateString('en-CA') : ""}
                        type="date"
                        onChange={e => {
                            const date = new Date(e.target.value);
                            date.setHours(0, 0, 0, 0);
                            changeExceptionHandler(elem.id, date.toLocaleDateString("en-CA"), "date");
                        }}
                    />
                </td>
                <td>
                    <input
                        className={styles.exception_time}
                        id={`timeStart-${elem.id}`}
                        autoComplete="off"
                        value={elem.timeStart !== undefined
                            ? `${String(Math.floor(elem.timeStart / 60)).padStart(2, '0')}:${String(elem.timeStart % 60).padStart(2, '0')}`
                            : ""}
                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeExceptionHandler(elem.id, totalMinutes, "timeStart");
                        }}
                    />
                </td>
                <td>
                    <input
                        className={styles.exception_time}
                        id={`timeFinish-${elem.id}`}
                        autoComplete="off"
                        value={elem.timeFinish !== undefined
                            ? `${String(Math.floor(elem.timeFinish / 60)).padStart(2, '0')}:${String(elem.timeFinish % 60).padStart(2, '0')}`
                            : ""}

                        type="time"
                        onChange={e => {
                            const [hours, minutes] = e.target.value.split(":").map(Number);
                            const totalMinutes = hours * 60 + minutes; // Переводим время в минуты от начала дня
                            changeExceptionHandler(elem.id, totalMinutes, "timeFinish");
                        }}
                    />
                </td>
                <td>

                    <DropdownSelectTimeType
                        onSelect={(value) => { changeExceptionHandler(elem.id, value, "timeType"); }}
                        selectedValue={elem.type || null}
                    />
                </td>
            </tr>
        )

        )
    let unitFocusActionValueReactNodes = unitsValue[focusIndexUnit]?.actions.map((elem, index) => (

        (
            <tr key={index}>
                <td>
                    <Image className={styles.icon_del}
                        src={del} alt="del" width={20} height={20}
                        onClick={() => deleteUnitActionHandler(index)}
                    />
                </td>


                <td>
                    <DropdownSelectUnitAction
                        options={actions}
                        onSelect={(value) => { changeUnitActionHandler(index, value, "action"); }}
                        selectedValue={elem.action?.id || null}

                    />
                </td>
                <td>
                    <input
                        className={styles.unit_koef}
                        id={`koef-${index}`}
                        autoComplete="off"
                        value={elem.koef}
                        type="number"
                        max={2147483647}
                        min={0}
                        onChange={e => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                changeUnitActionHandler(index, Number(e.target.value), "koef");
                            }
                        }}
                    />
                </td>
            </tr>
        )
    ))
    return (

        <div className={styles.units}>
            <div className={styles.contaitainer_catalog_left}>
                <div className="catalog_title">Каталог производственных центров (юнитов)</div>
                <div className={styles.container_units}>


                    {/* Шапка таблицы */}
                    <table className={styles.units_table}>
                        <thead>
                            <tr>
                                <th className={styles.icon_del_top}></th>
                                <th className={styles.icon_del_top}></th>
                                <th className={styles.units_code_top}>Код</th>
                                <th className={styles.units_title_top}>Название</th>
                                <th className={styles.units_belong_top}>Чей</th>
                                <th className={styles.units_retool_top}>Наладка(мин.)</th>
                                <th className={styles.units_type_top}>Тип</th>
                                <th className={styles.units_coment_top}>Коментарий</th>
                                <th className={styles.icon_save_top}></th>
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
                        </div>
                    </div>
                </div>
            </div>



            {(focusIndexUnit >= 0) &&
                <div className={styles.contaitainer_catalog_right}>
                    <div>
                        <div className="catalog_title">Действия юнита: {unitsValue[focusIndexUnit].title}</div>
                        <div className={styles.container_unit_actions}>
                            <table >
                                <thead>
                                    <tr>
                                        <th className={styles.icon_del_top}></th>
                                        <th className={styles.unit_action_top}>Действие</th>
                                        <th className={styles.unit_koef_top}>Коэф</th>
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
                        <div className="catalog_title">Отклонения юнита от общего графика</div>
                        <div className={styles.container_unit_exceptions}>
                            <table >
                                <thead>
                                    <tr>
                                        <th className={styles.icon_del_top}></th>
                                        <th className={styles.exception_date_top}>Дата</th>
                                        <th className={styles.exception_time_top}>Начало</th>
                                        <th className={styles.exception_time_top}>Конец</th>
                                        <th className={styles.exception_time_type_top}>Тип</th>
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