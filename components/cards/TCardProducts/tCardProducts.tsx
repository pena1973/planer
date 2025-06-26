
import styles from "./tCardProducts.module.scss";
import { TCardOperationItem, TCardProductItem, UOMItem } from '@/types/types'
import Image from 'next/image';

import TCardProduct from "@/components/cards/TCardProduct/tCardProduct";
import TCardProductNew from "@/components/cards/TCardProductNew/tCardProductNew";

import { useEffect, useState, useRef } from "react";


const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import edit from "@/public/edit-rem.png";

import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface TCardProductsProps {
    tCardProducts: TCardProductItem[],
    tCardOperations?: TCardOperationItem[], // для прорисовки статусов
    saveProductsHandler: (tProductsValue: TCardProductItem[]) => void;
    dragOverHandler: (e: React.DragEvent<HTMLElement>) => void,
    dropHandler: (e: React.DragEvent<HTMLElement>) => void,
    setCurrentDraggingElement: ({ }: string) => void,
    handleMouseDown: (code: string) => void,
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void,
    isDragging: boolean,
    currentDraggingElement: string,
    positionX: number,
    positionY: number,
    handleDrop: (e: React.DragEvent<HTMLDivElement>, target: string) => void,
    possibleEdit: boolean,
    prefix: string,
    updateIdc: (currentId: number) => void,
    // setCartEdited: () => void,
    maxIdc: number,
    setMaxIdc: (maxIdc: number) => void,
    lightProduct: number,  // idc  продукта который нужно выделить цветом  
    
}

export default function TCardProducts({
    tCardProducts,
    tCardOperations,
    saveProductsHandler,
    dragOverHandler,
    dropHandler,
    setCurrentDraggingElement,
    handleMouseDown,
    handleMouseUp,
    isDragging,
    currentDraggingElement,
    positionX,
    positionY,
    handleDrop,
    possibleEdit,
    prefix,    
    maxIdc,
    setMaxIdc,
    lightProduct,
    
}: TCardProductsProps) {

    const [edited, setEdited] = useState(false);
    // const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [tProductsValue, setTProductsValue] = useState([] as TCardProductItem[]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setTProductsValue(tCardProducts);
    }, [tCardProducts]);

    // колбеки кнопки
    const deleteProductHandler = (indexToRemove: number) => {
        const tProductsValueUpdated = [...tProductsValue]
        tProductsValueUpdated.splice(indexToRemove, 1)
        setTProductsValue(tProductsValueUpdated)
        // setCartEdited();
    };

    const changeProductHandler = (indexToChange: number, id: number, title: string, qtu: number, uom: UOMItem | null) => {
        const product = tProductsValue[indexToChange];
        const updatedProduct = { ...product, title: title, qtu: qtu, uom: uom ?? product.uom }
        const tProductsValueUpdated = [...tProductsValue]
        tProductsValueUpdated.splice(indexToChange, 1, updatedProduct)
        setTProductsValue(tProductsValueUpdated)
        // setCartEdited();
    };

    const checkUOMFilled = (uom: UOMItem | null): boolean => {
        // проверяем uom заполнен
        return (uom !== null &&
            uom !== undefined &&
            uom.id !== undefined &&
            uom.title !== undefined &&
            uom.title.trim() !== ""
        );
    };
    const saveProducts = () => {
        setMessage("");
        // проверяем на заполненность
        let isOK = true;
        tProductsValue.forEach((elem) => {
            if (elem.uom === null || !checkUOMFilled(elem.uom)) {
                setMessage("Заполните единицу измерения!");
                isOK = false;
                return;
            }

            if (!elem.qtu) {
                setMessage("Заполните количество продукта!");
                isOK = false;
                return;
            }
        })
        if (isOK) {
            saveProductsHandler(tProductsValue);
            setEdited(!isOK);
        }
    };

    const addProductHandler = () => {
        const idc = maxIdc + 1;
        const newProduct = {
            idc: idc,
            code: "",
            title: "Продукт",
            qtu: 0,
            uom: {} as UOMItem,
            mode: true,
        } as TCardProductItem;
        setTProductsValue([...tProductsValue, newProduct])
        setMaxIdc(idc);

    };

    const tCardProductsReactNodes = tProductsValue.map((elem, index) => {

        const regex = /^([A-Z])(\d+)([IO])(\d+)/; // Регулярное выражение для извлечения компонентов
        const match = elem.code.match(regex);
        const idc = (match) ? parseInt(match[2], 10) : NaN;  // idc операции (цифры)
        const status = tCardOperations?.find(op => op.idc === idc)?.status;

        return (<>
            {edited &&
                <TCardProductNew
                     key={'products' + index}
                    idc={elem.idc}
                    prefix={prefix}
                    code={elem.code}
                    title={elem.title}
                    qtu={elem.qtu}
                    uom={elem.uom}
                    changeProductHandler={changeProductHandler}
                    deleteProductHandler={deleteProductHandler}
                    index={index}
                />}
            {!edited &&
                <TCardProduct
                    key={'products' + index}
                    idc={elem.idc}
                    code={elem.code}
                    title={elem.title}
                    qtu={elem.qtu}
                    uom={elem.uom}
                    dragOverHandler={dragOverHandler}
                    dropHandler={dropHandler}
                    setCurrentDraggingElement={setCurrentDraggingElement}
                    handleMouseDown={handleMouseDown}
                    handleMouseUp={handleMouseUp}
                    isDragging={isDragging}
                    currentDraggingElement={currentDraggingElement}
                    positionX={positionX}
                    positionY={positionY}
                    handleDrop={handleDrop}
                    prefix={prefix}
                    index={index}
                    lightProduct={lightProduct}
                    status={status}
                />}
        </>
        );
    })

    return (

        <div
            className={styles.container}
            onDragOver={(e) => dragOverHandler(e)}
            onDrop={(e) => {
                handleDrop(e, prefix)
            }} >

            {tCardProductsReactNodes}

            {possibleEdit && <>
                {!edited && <div className={styles.container_buttons_row}>

                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={edit}
                            alt="arrow" width={20} height={20}
                            onClick={() => { setEdited(true); }}
                        />
                    </div>
                </div>}
                {edited && <div className={styles.container_buttons_row}>
                    <div className={styles.message}>{message}</div>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={add}
                            alt="arrow" width={20} height={20}
                            onClick={() => { addProductHandler() }}
                        />
                    </div>
                    <div className={styles.container_icon_edit_save}>
                        <Image className={styles.icon_edit_save}
                            src={save}
                            alt="arrow" width={20} height={20}
                            onClick={() => { saveProducts() }}
                        />
                    </div>
                </div>}
            </>}

        </div>



    )
}