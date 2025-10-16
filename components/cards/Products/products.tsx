
import styles from "./products.module.scss";
import { ProductItem, UOMItem } from '@/types/types'
import Image from 'next/image';

import Product from "@/components/cards/Products/Product/product";
import ProductNew from "@/components/cards/Products/ProductNew/productNew";

import { useEffect, useState, useRef } from "react";

import edit from "@/public/edit-rem.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

// FIX: стабильный локальный ключ для элементов без id/idc
const __prodLocalKeys = new WeakMap<object, string>();         // FIX
let __prodSeq = 1;                                              // FIX
const localKeyForProd = (o: object) => {                        // FIX
    let k = __prodLocalKeys.get(o);
    if (!k) { k = `prod-tmp-${__prodSeq++}`; __prodLocalKeys.set(o, k); }
    return k;
};
// FIX: генератор ключа строки
const rowKeyOf = (p: ProductItem, i: number) =>                 // FIX
    `prod-${p.id ?? p.idc ?? p.sync ?? localKeyForProd(p as object)}-${i}`;

export interface TCardProductsProps {
    products: ProductItem[],
    saveProductsHandler: (products: ProductItem[]) => void;
    updateIdc: (currentId: number) => void,
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
    lightProduct: number,  // idc  продукта который нужно выделить цветом  
    maxIdc: number,
    setMaxIdc: (maxIdc: number) => void,
    isPossibleToDelete: (idc: number) => boolean,
}

export default function TCardProducts({
    products,
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
    lightProduct,
    maxIdc,
    setMaxIdc,
    isPossibleToDelete
}: TCardProductsProps) {

    const [edited, setEdited] = useState(false);
    const [productsValue, setProductsValue] = useState([] as ProductItem[]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!edited)
            setProductsValue(products);
    }, [products]);

    // колбеки кнопки
    const deleteProductHandler = (indexToRemove: number, idc:number) => {
        //  проверка можно удалить или он уже задействован в расчетах
        if (isPossibleToDelete(idc)) {
            const productsValueUpdated = [...productsValue]
            productsValueUpdated.splice(indexToRemove, 1)
            setProductsValue(productsValueUpdated)
        }
    };

    const changeProductHandler = (indexToChange: number, title: string, sync: string, uom: UOMItem | null) => {
        const product = productsValue[indexToChange];
        const updatedProduct = { ...product, title: title, sync: sync, uom: uom ?? product.uom }
        const productsValueUpdated = [...productsValue]
        productsValueUpdated.splice(indexToChange, 1, updatedProduct)
        setProductsValue(productsValueUpdated)
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
        let isOK = true;
        productsValue.forEach((elem) => {
            if (elem.uom === null || !checkUOMFilled(elem.uom)) {
                setMessage("Заполните единицу измерения!");
                isOK = false;
                return;
            }

            if (!elem.title) {
                setMessage("Заполните название продукта!");
                isOK = false;
                return;
            }
        })
        if (isOK) {
            saveProductsHandler(productsValue);
            setEdited(!isOK);
        }
    };

    const addProductHandler = () => {
        const idc = maxIdc + 1;
        const newProduct = {
            idc: idc,
            title: "Продукт",
            uom: {} as UOMItem,
            sync: "sync" + idc
        } as ProductItem;
        setProductsValue([...productsValue, newProduct])
        setMaxIdc(idc);
    };
   
    const productsReactNodes = productsValue.map((elem, index) => {
        const rowKey = rowKeyOf(elem, index);

        if (edited) {
            return (
                <ProductNew
                    key={rowKey}
                    idc={elem.idc}
                    title={elem.title}
                    uom={elem.uom}
                    sync={elem.sync}
                    changeProductHandler={changeProductHandler}
                    deleteProductHandler={deleteProductHandler}
                    index={index}
                />
            );
        }

        return (
            <Product
                key={rowKey}
                idc={elem.idc}
                title={elem.title}
                uom={elem.uom}
                sync={elem.sync}
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
            />
        );
    });

    return (

        <div className={styles.container}>
            {productsReactNodes}

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