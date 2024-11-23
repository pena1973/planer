import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./tCardOperNew.module.scss";
import { TCardOperationItem, TCardProductItem, ActionItem, UOMItem } from '@/types'

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

import { useRouter, usePathname } from 'next/navigation';
import { mock } from "node:test";

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");


export interface TCardOperNewProps {
    id: number,
    inn: TCardProductItem[],
    out: TCardProductItem[],
    action: ActionItem | null,
    duration: number,
    deleteOperHandler: (id: number) => void,
    saveOperHandler: (
        id: number,
        inn: TCardProductItem[],
        out: TCardProductItem[],
        action: ActionItem | null,
        duration: number) => void
}

export default function TCardOperNew({
    id,
    inn,
    out,
    action,
    duration,
    deleteOperHandler,
    saveOperHandler
}: TCardOperNewProps) {
    const { push, back } = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();


    const [edited, setEdited] = useState(false);
    const [message, setMessage] = useState("");

    const [innValue, setInnValue] = useState([] as TCardProductItem[]);
    const [outValue, setOutValue] = useState([] as TCardProductItem[]);
    const [actionValue, setActionValue] = useState<ActionItem | null>(null);
    const [durationValue, setDurationValue] = useState(0);


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
        setDurationValue(duration)
    }, [inn, out, duration, action]);


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
        setEdited(true)
        if (mode === "inn") {
            setInnValue([...innValue, {} as TCardProductItem]);
        }
        if (mode === "out") {
            setOutValue([...outValue, {} as TCardProductItem]);
        }
    }
    const delRowHandler = (mode: string, indexToRemove: number) => {
        setEdited(true)
        if (mode === "inn") {
            const updatedInnValue = [...innValue];
            updatedInnValue.splice(indexToRemove, 1);
            setInnValue(updatedInnValue);
        }
        if (mode === "out") {
            const updatedOutValue = [...outValue];
            updatedOutValue.splice(indexToRemove, 1);
            setOutValue(updatedOutValue);
        }
    }
    // ! событие перевод строки на другую по кнопке enter
    const onKeyDown = (e: React.KeyboardEvent<HTMLElement>, id: number, pref: string) => {
        if (e.key === 'Enter') {
            let index = out.findIndex(elem => elem.id === id);
            let focusElem = out[(index === out.length - 1) ? index : index + 1];
            document.getElementById(pref + focusElem.id)?.focus();
        }
    }
    // Это событие ввода в инпуты
    const setInOutHandler = (value: string | number, index: number, fieldName: string, in_out: string) => {

        if (fieldName === "qtu" && !/^\d*$/.test(String(value))) return

        setEdited(true);
        if (in_out === "in") {
            let innValueUpdated = innValue.map((product, index1) => {
                if (index1 === index) {
                    return { ...product, [fieldName]: value };
                }
                return product;
            });
            setInnValue(innValueUpdated);
        }

        if (in_out === "out") {
            let outValueUpdated = outValue.map((product, index1) => {
                if (index1 === index) {
                    return { ...product, [fieldName]: value };
                }
                return product;
            });
            setOutValue(outValueUpdated);
        }
    }

    const handleUOMSelectOut = (id: number, uom: { id: number, title: string } | null) => {
        if (!uom) return;
        const outUpdated = outValue.map(product =>
            (product.id === id) ? { ...product, uom: uom } : product
        )
        setOutValue(outUpdated);
        setEdited(true);
    };

    const handleUOMSelectInn = (id: number, uom: { id: number, title: string } | null) => {
        if (!uom) return;
        const innUpdated = innValue.map(product =>
            (product.id === id) ? { ...product, uom: uom } : product
        )
        setInnValue(innUpdated);
        setEdited(true);

    };
    const handleSelectOper = (oper: { id: number, title: string } | null) => {
        setEdited(true);
        setActionValue(oper);
    };

    let resultReactNodes = outValue.map((elem2, index) => {
        return (
            <div key={index} className={styles.container_in_out_item}>
                <Image className={styles.icon_del}
                    src={del}
                    alt="arrow" width={20} height={20}
                    onClick={() => delRowHandler("out", index)}
                />
                <input className={styles.in_out_item_code}
                    id={"out" + elem2.id} autoComplete="off"
                    value={elem2.code} type="text"
                    onChange={e => { setInOutHandler(e.target.value, index, "code", "out"); }}
                    onKeyDown={e => onKeyDown(e, index, "out-code-")}
                />

                <input className={styles.in_out_item_qtu} id={"out" + elem2.id} autoComplete="off"
                    value={elem2.qtu} type="number"
                    onChange={e => { setInOutHandler(e.target.value, index, "qtu", "out") }}
                    onKeyDown={e => onKeyDown(e, index, "out-qtu-")} />

                <DropdownSelectUOM
                    options={uoms}
                    onSelect={(uom) => { handleUOMSelectOut(elem2.id, uom) }}
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
                    onClick={() => delRowHandler("inn", index)}
                />
                <input className={styles.in_out_item_code}
                    id={"in" + elem3.code} autoComplete="off"
                    value={elem3.code} type="text"
                    onChange={e => { setInOutHandler(e.target.value, index, "code", "in") }}
                    onKeyDown={e => onKeyDown(e, elem3.id, "in-code-")} />

                <input className={styles.in_out_item_qtu}
                    id={"in" + elem3.id} autoComplete="off"
                    value={elem3.qtu} type="number"
                    onChange={e => { setInOutHandler(e.target.value, index, "qtu", "in") }}
                    onKeyDown={e => onKeyDown(e, elem3.id, "in-qtu-")} />

                <DropdownSelectUOM
                    options={uoms}
                    onSelect={(uom) => { handleUOMSelectInn(elem3.id, uom) }}
                    selectedValue={elem3.uom ? elem3.uom.id : null}
                />
            </div>
        )

    })

    return (
        <div key={0} className={styles.container_tCardOper}>
            <div className={styles.container_tCardOper_out}>
                <div className={styles.tCardOper_out_title}>result</div>
                <div className={styles.tCardOper_out}>
                    {resultReactNodes}
                    <div className={styles.tCardOper_buttons_container} >
                        <button onClick={() => addRowHandler("out")}>добавить</button>
                    </div>
                </div>

            </div>

            <div className={styles.container_tCardOper_action}>
                <div className={styles.tCardOper_action_title}>action</div>
                <div className={styles.tCardOper_action}>
                    <DropdownSelectOper
                        options={actions}
                        onSelect={handleSelectOper}
                        selectedValue={actionValue ? actionValue.id : null}
                    />
                    <input className={styles.in_out_item_qtu}
                        id={"duration"} autoComplete="off"
                        value={durationValue} type="number"
                        onChange={e => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                                setDurationValue(Number(e.target.value))
                            }
                        }}
                    />
                    <div className={styles.tCardOper_oper_qtu}> ms</div>
                </div>
            </div>

            <div className={styles.container_tCardOper_in}>
                <div className={styles.tCardOper_in_title}>sourse</div>
                <div className={styles.tCardOper_in}>
                    {sourceReactNodes}
                    <div className={styles.tCardOper_buttons_container} >
                        <button onClick={() => addRowHandler("inn")}>добавить</button>
                    </div>
                </div>
            </div>
            <div className={styles.container_buttons_row}>
                <div className={styles.message}>{message}</div>
                <div className={styles.container_icon_edit_save}>
                    <Image className={styles.icon_edit_save}
                        src={save}
                        alt="arrow" width={20} height={20}
                        onClick={() => {
                            if (checkUOMFilled(innValue) && checkUOMFilled(outValue)){
                                setMessage("");
                                saveOperHandler(
                                    id,
                                    innValue,
                                    outValue,
                                    actionValue,
                                    durationValue,)
                                } else setMessage("Заполните единицу измерения!")
                        }}
                    />

                </div> {edited && <div>*</div>}
                <Image className={styles.icon_del}
                    src={del} alt="del" width={20} height={20}
                    onClick={() => deleteOperHandler(id)}
                />
            </div>
        </div>
    )
}