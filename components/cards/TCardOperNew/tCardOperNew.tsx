import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./tCardOperNew.module.scss";
import { TCardOperationItem, TCardProductItem, ActionItem, UOMItem } from '@/types'
import { StatusCircle } from "@/components/cards/StatusCircle/statusCircle";
import { convertMillisecondsToTime, convertTimeToMilliseconds } from '@/utils'

import DropdownSelectUOM from '@/components/DropdownSelectUOM/dropdownSelectUOM'; // Путь к вашему компоненту
import DropdownSelectOper from '@/components/DropdownSelectOper/dropdownSelectOper'; // Путь к вашему компоненту
import { } from '@/store/slices';

import Head from "next/head";
import Image from 'next/image';
import Link from 'next/link';

import save from "@/public/save-rem.png";
import edit from "@/public/edit-rem.png";
import del from "@/public/del2.png";
import add from "@/public/add-rem.png";
import cancel from "@/public/cancel.png";

import { useRouter, usePathname } from 'next/navigation';
import { mock } from "node:test";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export interface TCardOperNewProps {
    tCardOperation: TCardOperationItem;
    // idc: number,
    // inn: TCardProductItem[],
    // out: TCardProductItem[],
    // action: ActionItem | null,
    // duration: number,
    deleteOperHandler: (id: number) => void,
    saveOperHandler: (
        id: number,
        inn: TCardProductItem[],
        out: TCardProductItem[],
        action: ActionItem | null,
        coment:string,
        duration: number) => void,
     cancelOperHandler: (id: number) => void,
    updateIdc: (currentId: number) => void,
    setCartEdited: () => void,
    maxIdc: number
}

export default function TCardOperNew({
    tCardOperation,
    // idc,
    // inn,
    // out,
    // action,
    // duration,
    deleteOperHandler,
    saveOperHandler,
     cancelOperHandler,
    updateIdc,
    setCartEdited,
    maxIdc
}: TCardOperNewProps) {
    const { push, back } = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const idc = tCardOperation.idc;
    const inn = tCardOperation.inn;
    const out = tCardOperation.out;
    const action = tCardOperation.action;
    const duration = tCardOperation.duration;
    const coment = (tCardOperation.coment)?tCardOperation.coment:"";

    const [edited, setEdited] = useState(false);
    const [message, setMessage] = useState("");

    const [innValue, setInnValue] = useState([] as TCardProductItem[]);
    const [outValue, setOutValue] = useState([] as TCardProductItem[]);
    const [actionValue, setActionValue] = useState<ActionItem | null>(null);
    // const [durationValue, setDurationValue] = useState(0);
    const [hourValue, setHourValue] = useState(0);
    const [minutValue, setMinutValue] = useState(0);
    const [secundValue, setSecundValue] = useState(0);
    const [msValue, setMSValue] = useState(0);
    const [comentValue, setComentValue] = useState("");


    //  проверим есть ли что в сессионном храилище
    const actions = useSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })
    const uoms = useSelector((state: RootState) => {
        return state.catalogSlice.uoms;
    })

    useEffect(() => {

        setInnValue(inn);
        setOutValue(out);
        setActionValue(action);
        setComentValue(coment);
        const { hours, minutes, seconds, milliseconds } = convertMillisecondsToTime(duration);

        // setDurationValue(duration)

        setHourValue(hours)
        setMinutValue(minutes)
        setSecundValue(seconds)
        setMSValue(milliseconds)

    }, []);

    const cancelHandler = () => {
        // const { hours, minutes, seconds, milliseconds } = convertMillisecondsToTime(duration);

        // setInnValue(inn);
        // setOutValue(out);
        // setActionValue(action);
        // setActionValue(action);
        // // setDurationValue(duration)
        // setHourValue(hours)
        // setMinutValue(minutes)
        // setSecundValue(seconds)
        // setMSValue(milliseconds)

         cancelOperHandler(idc);
    };


    const checkUOMFilled = (arr: TCardProductItem[]): boolean => {
        // Проверяем, что для каждого элемента массива inn, его uom заполнен
        return arr.every(item =>
            item.uom !== undefined &&
            item.uom.id !== undefined &&
            item.uom.title !== undefined &&
            item.uom.title.trim() !== ""
        );
    };

    const addRowHandler = (mode: string) => {

        let currentId = maxIdc + 1;

        setEdited(true);
        setCartEdited();
        if (mode === "I") {
            setInnValue([...innValue, { idc: currentId, codeS: "" } as TCardProductItem]);
        }
        currentId = currentId + 1;
        let idinn = currentId + 1;
        if (mode === "O") {
            setOutValue([...outValue, { idc: currentId, codeS: `A${idc}O` + idinn } as TCardProductItem]);
        }
        updateIdc(idinn);
        // согласование
        
    }

    const delRowHandler = (mode: string, indexToRemove: number) => {
        setEdited(true)
        setCartEdited();
        if (mode === "I") {
            const updatedInnValue = [...innValue];
            updatedInnValue.splice(indexToRemove, 1);
            setInnValue(updatedInnValue);
        }
        if (mode === "O") {
            const updatedOutValue = [...outValue];
            updatedOutValue.splice(indexToRemove, 1);
            setOutValue(updatedOutValue);
        }
    }
    // ! событие перевод строки на другую по кнопке enter
    const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, id: number, pref: string) => {
        if (e.key === 'Enter') {
            let index = out.findIndex(elem => elem.idc === id);
            let focusElem = out[(index === out.length - 1) ? index : index + 1];
            document.getElementById(pref + focusElem.idc)?.focus();
        }
    }
    // Это событие ввода в инпуты
    const setInOutHandler = (value: string | number, index: number, fieldName: string, in_out: string) => {

        if (fieldName === "qtu" && !/^\d*$/.test(String(value))) return

        let value1 = (fieldName === "qtu") ? Number(value) : value

        setEdited(true);
        setCartEdited();
        if (in_out === "I") {
            let innValueUpdated = innValue.map((product, index1) => {
                if (index1 === index) {
                    return { ...product, [fieldName]: value1 };
                }
                return product;
            });
            setInnValue(innValueUpdated);
        }

        if (in_out === "O") {
            let outValueUpdated = outValue.map((product, index1) => {
                if (index1 === index) {
                    return { ...product, [fieldName]: value1 };
                }
                return product;
            });
            setOutValue(outValueUpdated);
        }
    }

    const handleUOMSelectOut = (idc: number, uom: { id: number, title: string, code: string } | null) => {
        if (!uom) return;
        const outUpdated = outValue.map(product =>
            (product.idc === idc) ? { ...product, uom: uom } : product
        )
        setOutValue(outUpdated);
        setEdited(true);
        setCartEdited();
    };

    const handleUOMSelectInn = (idc: number, uom: { id: number, title: string, code: string } | null) => {
        if (!uom) return;
        const innUpdated = innValue.map(product =>
            (product.idc === idc) ? { ...product, uom: uom } : product
        )
        setInnValue(innUpdated);
        setEdited(true);
        setCartEdited();

    };
    const handleSelectOper = (oper: { id: number, title: string } | null) => {

        let foundOper = actions.find(elem => { return elem.id === oper?.id })
        setEdited(true);
        setCartEdited();
        setActionValue((!foundOper) ? null : foundOper);
    };


    // Функция для автоматической подгонки высоты
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Функция для автоматической подгонки высоты
    const adjustHeight = () => {
        if (textareaRef.current) {
          // Сбрасываем высоту до авто, чтобы она подстраивалась под содержимое
          textareaRef.current.style.height = 'auto'; 
      
          // Если высота содержимого меньше или равна 100px, подстраиваем высоту
          if (textareaRef.current.scrollHeight <= 100) {
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;  // Устанавливаем высоту в зависимости от содержимого
            textareaRef.current.style.overflowY = 'hidden';  // Убираем прокрутку, когда высота меньше 100px
          } else {
            // Когда содержимое превышает 100px, фиксируем высоту на 100px и включаем прокрутку
            textareaRef.current.style.height = '100px';
            textareaRef.current.style.overflowY = 'auto';  // Включаем вертикальную прокрутку
          }
        }
      };
      
      

    // Подстраиваем высоту после рендера или изменения содержимого
    useEffect(() => {
        adjustHeight();
    }, [comentValue]); // Каждый раз, когда изменяется содержимое, высота будет пересчитана


    let resultReactNodes = outValue.map((elem2, index) => {
        return (
            <div key={index} className={styles.container_in_out_item}>
                <Image className={styles.icon_del}
                    src={del}
                    alt="arrow" width={20} height={20}
                    onClick={() => delRowHandler("O", index)}
                />
                {/* код результата операции */}
                <div className={styles.in_out_item_code_out}>{elem2.codeS}</div>

                <input className={styles.in_out_item_title}
                    id={"O-title-" + elem2.idc} autoComplete="off"
                    value={elem2.title} type="text"
                    onChange={e => { setInOutHandler(e.target.value, index, "title", "O"); }}
                    onKeyDown={e => onKeyDown(e, index, "O-title-")}
                />

                <input className={styles.in_out_item_qtu}
                    id={"O-qtu-" + elem2.idc} autoComplete="off"
                    value={elem2.qtu} type="number"
                    onChange={e => { setInOutHandler(e.target.value, index, "qtu", "O") }}
                    onKeyDown={e => onKeyDown(e, index, "O-qtu-")} />

                <DropdownSelectUOM
                    options={uoms}
                    onSelect={(uom) => { handleUOMSelectOut(elem2.idc, uom) }}
                    selectedValue={elem2.uom ? elem2.uom.id : null}
                // selectedValue={selectedUnitOut ? selectedUnitOut.id : null}
                />
            </div>
        )
    })

    let sourceReactNodes = innValue.map((elem3, index) => {

        return (
            <div key={index} className={styles.container_in_out_item}>
                <Image className={styles.icon_del}
                    src={del}
                    alt="arrow" width={20} height={20}
                    onClick={() => delRowHandler("I", index)}
                />
                {/* код источника */}
                {/* <input className={styles.in_out_item_codeS}
                    id={"in-title-" + elem3.idc} autoComplete="off"
                    value={elem3.codeS} type="text"
                    onChange={e => { setInOutHandler(e.target.value, index, "codeS", "I") }}
                    onKeyDown={e => onKeyDown(e, elem3.idc, "in-codeS")} /> */}

                <div className={styles.in_out_item_code_out}>{elem3.codeS}</div> 

                <input className={styles.in_out_item_title}
                    id={"in-title-" + elem3.idc} autoComplete="off"
                    value={elem3.title} type="text"
                    onChange={e => { setInOutHandler(e.target.value, index, "title", "I") }}
                    onKeyDown={e => onKeyDown(e, elem3.idc, "in-title-")} />

                <input className={styles.in_out_item_qtu}
                    id={"in-qtu-" + elem3.idc} autoComplete="off"
                    value={elem3.qtu} type="number"
                    onChange={e => { setInOutHandler(e.target.value, index, "qtu", "I") }}
                    onKeyDown={e => onKeyDown(e, elem3.idc, "in-qtu-")} />

                <DropdownSelectUOM
                    options={uoms}
                    onSelect={(uom) => { handleUOMSelectInn(elem3.idc, uom) }}
                    selectedValue={elem3.uom ? elem3.uom.id : null}
                />
            </div>
        )

    })

    return (
        <div key={0} className={styles.container}>
            <div className={styles.container_header}>
                <div className={styles.container_status}>
                    <StatusCircle status={tCardOperation.status} />
                    &nbsp;
                    {tCardOperation.status}
                </div>
                Action {tCardOperation.idc}
                <div className={styles.plug}></div>
            </div>

            {/* <div className={styles.tCardOper_id}> C{idc}</div> */}
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelHandler() }}
            />
            <div className={styles.container_out}>
                <div className={styles.out_title}>result</div>
                <div className={styles._out}>
                    {resultReactNodes}
                    <div className={styles.tCardOper_buttons_container} >
                        <button onClick={() => addRowHandler("O")}>добавить</button>
                    </div>
                </div>


            </div>

            <div className={styles.container_action}>
                <div className={styles.action_title}>action</div>
                <div className={styles._action}>
                    <DropdownSelectOper
                        options={actions}
                        onSelect={handleSelectOper}
                        selectedValue={actionValue ? actionValue.id : null}
                    />
                    <input className={styles.in_out_item_qtu}
                        id={"duration"} autoComplete="off"
                        value={hourValue} type="number"
                        max={2147483647}
                        maxLength={6}
                        min={0}
                        onChange={e => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setEdited(true);
                                setHourValue(Number(e.target.value))
                            }
                        }}
                    />
                    h
                    <input className={styles.in_out_item_qtu}
                        id={"duration"} autoComplete="off"
                        value={minutValue} type="number"
                        max={2147483647}
                        maxLength={6}
                        min={0}
                        onChange={e => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setEdited(true);
                                setMinutValue(Number(e.target.value))
                            }
                        }}
                    />
                    m
                    <input className={styles.in_out_item_qtu}
                        id={"duration"} autoComplete="off"
                        value={secundValue} type="number"
                        max={2147483647}
                        maxLength={6}
                        min={0}
                        onChange={e => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setEdited(true);
                                setSecundValue(Number(e.target.value))
                            }
                        }}
                    />
                    s
                    <input className={styles.in_out_item_qtu}
                        id={"duration"} autoComplete="off"
                        value={msValue} type="number"
                        max={2147483647}
                        maxLength={6}
                        min={0}
                        onChange={e => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setEdited(true);
                                setMSValue(Number(e.target.value))
                            }
                        }}
                    />

                    <div className={styles.tCardOper_oper_qtu}> ms</div>
                </div>
            </div>

            <div className={styles.container_in}>
                <div className={styles.in_title}>sourse</div>
                <div className={styles._in}>
                    {sourceReactNodes}
                    <div className={styles.tCardOper_buttons_container} >
                        <button onClick={() => addRowHandler("I")}>добавить</button>
                    </div>
                </div>
            </div>
            <div className={styles.container_coment}>
                <div className={styles.coment_title}>comment</div>
                <div className={styles._coment}>
                    <textarea
                        ref={textareaRef}  // Привязываем ссылку
                        className={styles.coment_input}
                        id={"coment-" + tCardOperation.idc}
                        autoComplete="off"
                        value={comentValue}
                        onChange={e => { setComentValue(e.target.value) }}
                    />
                </div>
            </div>
            <div className={styles.container_buttons_row}>
                <div className={styles.message}>{message}</div>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => {
                            if (checkUOMFilled(innValue) && checkUOMFilled(outValue)) {
                                setMessage("");
                                saveOperHandler(
                                    idc,
                                    innValue,
                                    outValue,
                                    actionValue,
                                    comentValue,
                                    convertTimeToMilliseconds(hourValue, minutValue, secundValue, msValue),)
                            } else setMessage("Заполните единицу измерения!")
                        }}
                    />

                </div> {edited && <div>*</div>}
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                    onClick={() => deleteOperHandler(idc)}
                />
            </div>
        </div>
    )
}