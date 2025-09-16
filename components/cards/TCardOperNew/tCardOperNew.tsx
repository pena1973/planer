import { useState, useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import styles from "./tCardOperNew.module.scss";
import { TCardOperationItem, TCardProductItem, ActionItem, } from '@/types/types'
import { StatusCircle } from "@/components/StatusCircle/statusCircle";
import { convertMillisecondsToTime, convertTimeToMilliseconds } from '@/lib/client/utils.client'

import { ProductItem } from '@/types/types'
import DropdownSelectProduct from '@/components/DropdownSelectProduct/dropdownSelectProduct';

// import DropdownSelectUOM from '@/components/DropdownSelectUOM/dropdownSelectUOM'; // Путь к вашему компоненту
import DropdownSelectOper from '@/components/DropdownSelectOper/dropdownSelectOper'; // Путь к вашему компоненту
import { } from '@/store/slices';

import { useTranslation } from 'react-i18next';


import Image from 'next/image';


import save from "@/public/save-rem.png";
import del from "@/public/del2.png";
import cancel from "@/public/cancel.png";


const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export interface TCardOperNewProps {
    products: ProductItem[],
    tCardOperation: TCardOperationItem;
    deleteOperHandler: (id: number) => void,
    saveOperHandler: (
        id: number,
        inn: TCardProductItem[],
        out: TCardProductItem[],
        action: ActionItem | null,
        coment: string,
        duration: number) => void,
    cancelOperHandler: (id: number) => void,
    updateIdc: (currentId: number) => void,
    maxIdc: number
}

export default function TCardOperNew({
    products,
    tCardOperation,
    deleteOperHandler,
    saveOperHandler,
    cancelOperHandler,
    updateIdc,
    maxIdc
}: TCardOperNewProps) {
    const { t } = useTranslation();

    const idc = tCardOperation.idc;
    const inn = tCardOperation.inn;
    const out = tCardOperation.out;
    const action = tCardOperation.action;
    const duration = tCardOperation.duration;
    const coment = (tCardOperation.coment) ? tCardOperation.coment : "";

    const [edited, setEdited] = useState(false);
    const [message, setMessage] = useState("");

    const [innValue, setInnValue] = useState([] as TCardProductItem[]);
    const [outValue, setOutValue] = useState([] as TCardProductItem[]);
    const [actionValue, setActionValue] = useState<ActionItem | null>(null);
    const [hourValue, setHourValue] = useState(0);
    const [minutValue, setMinutValue] = useState(0);
    const [secundValue, setSecundValue] = useState(0);
    const [msValue, setMSValue] = useState(0);
    const [comentValue, setComentValue] = useState("");


    //  проверим есть ли что в сессионном храилище
    const actions = useAppSelector((state: RootState) => {
        return state.catalogSlice.actions;
    })
    
    interface Option {
        idc: number;
        title: string;
    }

    const options = useRef([] as Option[]);
    // const [message, setMessage] = useState("");
    useEffect(() => {
        options.current = products.map(p => { return { idc: p.idc, title: `${p.title}(${p.uom.title})` } });
    }, [products]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {

        setInnValue(inn);
        setOutValue(out);
        setActionValue(action);
        setComentValue(coment);
        const { hours, minutes, seconds, milliseconds } = convertMillisecondsToTime(duration);
        setHourValue(hours)
        setMinutValue(minutes)
        setSecundValue(seconds)
        setMSValue(milliseconds)

    }, []);

    const cancelHandler = () => {
        cancelOperHandler(idc);
    };

    // проверка операции перед записью на заполненность
    const checkOperationFilled = (): boolean => {
        // innValue, outValue, actionValue, hourValue, minutValue, secundValue, msValue

        let filled = true;

        filled = filled && innValue.every(item => (item.product));
        if (!filled) { setMessage(t('cardsopernew.fillProduct')); return filled }

        filled = filled && innValue.every(item => item.qtu !== 0);
        if (!filled) { setMessage(t('cardsopernew.fillQtu')); return filled }

        filled = filled && outValue.every(item => (item.product));
        if (!filled) { setMessage(t('cardsopernew.fillProduct')); return filled }

        filled = filled && outValue.every(item => item.qtu !== 0);
        if (!filled) { setMessage(t('cardsopernew.fillQtu')); return filled }

        filled = filled && (actionValue?.id)!==undefined;
        if (!filled) { setMessage(t('cardsopernew.fillAction')); return filled }

        filled = filled && (hourValue !== 0 || minutValue !== 0 || secundValue !== 0 || msValue !== 0);
        if (!filled) { setMessage(t('cardsopernew.fillDuration')); return filled }
      
        return filled;
    };

    const addRowHandler = (mode: string) => {
        //  let currentId = maxIdc + 1;
        setEdited(true);

        if (mode === "I") {
            setInnValue([...innValue, { product: {} as ProductItem, code: "", qtu: 0 } as TCardProductItem]);
        }
        //  currentId = currentId + 1;
        //  const idinn = currentId + 1;
        if (mode === "O") {
            setOutValue([...outValue, { product: {} as ProductItem, code: "", qtu: 0 } as TCardProductItem]);
            //  setOutValue([...outValue, { idc: currentId, code: `A${idc}O` + idinn } as TCardProductItem]);
        }
        //  updateIdc(idinn);
        // согласование

    }

    const delRowHandler = (mode: string, indexToRemove: number) => {
        setEdited(true)
        // setCartEdited();
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
        // if (e.key === 'Enter') {
        //     const index = out.findIndex(elem => elem.idc === id);
        //     const focusElem = out[(index === out.length - 1) ? index : index + 1];
        //     document.getElementById(pref + focusElem.idc)?.focus();
        // }
    }

    // Это событие ввода в инпуты
    const setInOutHandler = (value: string | number, index: number, fieldName: string, in_out: string) => {

        if (fieldName === "qtu" && !/^\d*$/.test(String(value))) return

        const value1 = (fieldName === "qtu") ? Number(value) : value

        setEdited(true);
        // setCartEdited();
        if (in_out === "I") {
            const innValueUpdated = innValue.map((product, index1) => {
                if (index1 === index) {
                    return { ...product, [fieldName]: value1 };
                }
                return product;
            });
            setInnValue(innValueUpdated);
        }

        if (in_out === "O") {
            const outValueUpdated = outValue.map((product, index1) => {
                if (index1 === index) {
                    return { ...product, [fieldName]: value1 };
                }
                return product;
            });
            setOutValue(outValueUpdated);
        }
    }

    // const handleUOMSelectOut = (idc: number, uom: { id: number, title: string, code: string } | null) => {
    //     if (!uom) return;
    //     const outUpdated = outValue.map(product =>
    //         (product.idc === idc) ? { ...product, uom: uom } : product
    //     )
    //     setOutValue(outUpdated);
    //     setEdited(true);

    // };

    const handleProductSelectOut = (index: number, option: Option | null) => {
        // Если не выбрано — ничего не делаем
        if (!option) return;

        const product = products.find(p => p.idc === option.idc);
        // Если не найден — покажем предупреждение и не обновляем
        if (!product) {
            setMessage("Продукт не найден");
            return;
        }
        const updatedTProduct = {
            ...outValue[index], product: product, code: `A${idc}O` + product.idc
        };

        const updatedOutValue = [...outValue];
        updatedOutValue.splice(index, 1, updatedTProduct);

        setOutValue(updatedOutValue);
        setEdited(true);
    };


    // const handleUOMSelectInn = (idc: number, uom: { id: number, title: string, code: string } | null) => {
    //     if (!uom) return;
    //     const innUpdated = innValue.map(product =>
    //         (product.idc === idc) ? { ...product, uom: uom } : product
    //     )
    //     setInnValue(innUpdated);
    //     setEdited(true);


    // };

    const handleProductSelectInn = (index: number, option: Option | null) => {
        // Если не выбрано — ничего не делаем
        if (!option) return;

        const product = products.find(p => p.idc === option.idc);
        // Если не найден — покажем предупреждение и не обновляем
        if (!product) {
            setMessage("Продукт не найден");
            return;
        }
        const updatedTProduct = {
            ...innValue[index], product: product, code: `M` + product.idc
        };

        const updatedInnValue = [...innValue];
        updatedInnValue.splice(index, 1, updatedTProduct);

        setInnValue(updatedInnValue);
        setEdited(true);
    };


    const handleSelectOper = (oper: { id: number, title: string } | null) => {

        const foundOper = actions.find(elem => { return elem.id === oper?.id })
        setEdited(true);
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


    const resultReactNodes = outValue.map((elem2, index) => {
        return (
            <div key={index} className={styles.container_in_out_item}>
                <Image className={styles.icon_del}
                    src={del}
                    alt="arrow" width={20} height={20}
                    onClick={() => delRowHandler("O", index)}
                />
                {/* код результата операции */}
                <div className={styles.in_out_item_code}>{elem2.code}</div>
                <DropdownSelectProduct
                    options={options.current}
                    onSelect={(option) => handleProductSelectOut(index, option)}
                    selectedValue={elem2.product ? elem2.product.idc : null}
                    width={"100%"}
                />
                <input className={styles.in_out_item_qtu}
                    id={"O-qtu-" + index} autoComplete="off"
                    value={elem2.qtu} type="number"
                    onChange={e => { setInOutHandler(e.target.value, index, "qtu", "O") }}
                    onKeyDown={e => onKeyDown(e, index, "O-qtu-")} />

            </div>
        )
    })

    const sourceReactNodes = innValue.map((elem3, index) => {

        return (
            <div key={index} className={styles.container_in_out_item}>
                <Image className={styles.icon_del}
                    src={del}
                    alt="arrow" width={22} height={20}
                    onClick={() => delRowHandler("I", index)}
                />


                <div className={styles.in_out_item_code}>{elem3.code}</div>
                <DropdownSelectProduct
                    options={options.current}
                    onSelect={(option) => handleProductSelectInn(index, option)}
                    selectedValue={elem3.product ? elem3.product.idc : null}
                    width={"100%"}
                />

                <input className={styles.in_out_item_qtu}
                    id={"in-qtu-" + index} autoComplete="off"
                    value={elem3.qtu} type="number"
                    onChange={e => { setInOutHandler(e.target.value, index, "qtu", "I") }}
                    onKeyDown={e => onKeyDown(e, elem3.product.idc, "in-qtu-")} />

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
                {t('cardsopernew.action')} {tCardOperation.idc}
                <div className={styles.plug}></div>
            </div>

            {/* <div className={styles.tCardOper_id}> C{idc}</div> */}
            <Image className={styles.icon_cancel}
                src={cancel}
                alt="arrow" width={24} height={24}
                onClick={() => { cancelHandler() }}
            />
            <div className={styles.container_out}>
                <div className={styles.out_title}>{t('cardsopernew.result')}</div>
                <div className={styles._out}>
                    {resultReactNodes}
                    <div className={styles.tCardOper_buttons_container} >
                        <button onClick={() => addRowHandler("O")}>{t('cardsopernew.add')}</button>
                    </div>
                </div>


            </div>

            <div className={styles.container_action}>
                <div className={styles.action_title}>{t('cardsopernew.action')}</div>
                <div className={styles._action}>
                    <DropdownSelectOper
                        options={actions}
                        onSelect={handleSelectOper}
                        selectedValue={actionValue ? actionValue.id : null}
                    />
                    <input className={styles.time}
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
                    <input className={styles.time}
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
                    <input className={styles.time}
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
                    <input className={styles.time}
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
                <div className={styles.in_title}> {t('cardsopernew.sourse')}</div>
                <div className={styles._in}>
                    {sourceReactNodes}
                    <div className={styles.tCardOper_buttons_container} >
                        <button onClick={() => addRowHandler("I")}>  {t('cardsopernew.add')}</button>
                    </div>
                </div>
            </div>
            <div className={styles.container_coment}>
                <div className={styles.coment_title}> {t('cardsopernew.comment')}</div>
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

                            if (checkOperationFilled()) {
                                setMessage("");
                                saveOperHandler(
                                    idc,
                                    innValue,
                                    outValue,
                                    actionValue,
                                    comentValue,
                                    convertTimeToMilliseconds(hourValue, minutValue, secundValue, msValue),)
                            }
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