
import styles from "./tCardProducts.module.scss";
import { TCardProductItem, UOMItem } from '@/types'
import Image from 'next/image';

import TCardProduct from "@/components/TCardProduct/tCardProduct";
import TCardProductNew from "@/components/TCardProductNew/tCardProductNew";
import { useEffect, useState, useRef } from "react";


const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

import edit from "@/public/edit-rem.png";
// import del from "@/public/del2.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface TCardProductProps {
    tCardCurrentProducts: TCardProductItem[],
    saveCurrentProductsHandler: (tProductsValue: TCardProductItem[]) => void;
    dragOverHandler: (e: React.DragEvent<HTMLElement>) => void,
    dropHandler: (e: React.DragEvent<HTMLElement>) => void,
    setCurrentDraggingElement: ({ }: string) => void,
    handleMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void,
    handleMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void,
    isDragging: boolean,
    currentDraggingElement: string,
    positionX: number,
    positionY: number,
    handleDrop: (e: React.DragEvent<HTMLDivElement>, target: string) => void,
    possibleEdit: boolean,
    prefix: string,
    useUniqueId: () => number
    setCartEdited: () => void
}

export default function TCardProducts({
    tCardCurrentProducts,
    saveCurrentProductsHandler,
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
    useUniqueId,
    setCartEdited,
}: TCardProductProps) {

    const [edited, setEdited] = useState(false);
    // const [modified, setModified] = useState(false); // при установке состояния происходит смена формы
    const [tProductsValue, setTProductsValue] = useState([] as TCardProductItem[]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setTProductsValue(tCardCurrentProducts);
    }, [tCardCurrentProducts]);

    // колбеки кнопки
    const deleteProductHandler = (indexToRemove: number) => {
        let tProductsValueUpdated = [...tProductsValue]
        tProductsValueUpdated.splice(indexToRemove,1)
        setTProductsValue(tProductsValueUpdated)
        setCartEdited();
    };

    const changeProductHandler = (indexToChange: number,id: number, title: string, qtu: number, uom: UOMItem | null) => {
        let product = tProductsValue[indexToChange];
        let updatedProduct = {...product, title:title, qtu:qtu, uom: uom ?? product.uom}
        let tProductsValueUpdated = [...tProductsValue]
        tProductsValueUpdated.splice(indexToChange,1,updatedProduct)
        setTProductsValue(tProductsValueUpdated)
        setCartEdited();
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
    const saveProductsHandler = () => {
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
            saveCurrentProductsHandler(tProductsValue);
            setEdited(!isOK);
        }
        setCartEdited();
    };

    const addProductHandler = () => {
        const idc = useUniqueId();
        let newProduct = {
            idc: idc,                        
            codeS: "",
            title: "Продукт",
            qtu: 0,
            uom: {} as UOMItem,
            mode: true,
        } as TCardProductItem;
        setTProductsValue([...tProductsValue, newProduct])
        setCartEdited();
    };

    let tCardProductsReactNodes = tProductsValue.map((elem,index) => {
        return (<>
            {edited &&
                <TCardProductNew
                    idc={elem.idc}  
                    prefix={prefix}                  
                    codeS={elem.codeS}
                    title={elem.title}
                    qtu={elem.qtu}
                    uom={elem.uom}
                    changeProductHandler={changeProductHandler}
                    deleteProductHandler={deleteProductHandler}
                    index={index}
                />}
            {!edited &&
                <TCardProduct
                    idc={elem.idc}                    
                    codeS={elem.codeS}
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
                />}
        </>
        );
    })

    return (

        <div className={styles.container_tCardProduct}
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
                            onClick={() => { saveProductsHandler() }}
                        />
                        {/* {modified && <div>*</div>} */}
                    </div>
                </div>}
            </>}

        </div>



    )
}