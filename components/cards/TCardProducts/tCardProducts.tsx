
import styles from "./tCardProducts.module.scss";
import { TCardOperationItem, TCardProductItem, UOMItem, ProductItem } from '@/types/types'
import Image from 'next/image';

import TCardProduct from "@/components/cards/TCardProducts/TCardProduct/tCardProduct";
import TCardProductNew from "@/components/cards/TCardProducts/TCardProductNew/tCardProductNew";

import { useEffect, useState, useRef } from "react";

import edit from "@/public/edit-rem.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface TCardProductsProps {
    products: ProductItem[],
    tCardProducts: TCardProductItem[],
    tCardOperations?: TCardOperationItem[], // для прорисовки статусов
    saveTCardProductsHandler: (tProductsValue: TCardProductItem[]) => void;
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
}

export default function TCardProducts({
    products,
    tCardProducts,
    tCardOperations,
    saveTCardProductsHandler,
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
}: TCardProductsProps) {

    const [edited, setEdited] = useState(false);    

    const [tProductsValue, setTProductsValue] = useState<(Omit<TCardProductItem, 'product'> & { product: ProductItem | null })[]>([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setTProductsValue(tCardProducts);
    }, [tCardProducts]);

    // колбеки кнопки
    const deleteProductHandler = (indexToRemove: number) => {
        const tProductsValueUpdated = [...tProductsValue]
        tProductsValueUpdated.splice(indexToRemove, 1)
        setTProductsValue(tProductsValueUpdated)
    };

    const changeProductHandler = (indexToChange: number, product: ProductItem | null, qtu: number) => {
        const tProduct = tProductsValue[indexToChange];
        const updatedTProduct = { ...tProduct, product: product, qtu: qtu }
        const tProductsValueUpdated = [...tProductsValue]
        tProductsValueUpdated.splice(indexToChange, 1, updatedTProduct)
        setTProductsValue(tProductsValueUpdated)
    };

    const saveProducts = () => {
        setMessage("");
        // проверяем на заполненность
        let isOK = true;
        tProductsValue.forEach((elem) => {
            if (!elem.product) {
                setMessage("Заполните продукт!");
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
            // Явно указываем: все product теперь точно не null
            const cleaned: TCardProductItem[] = tProductsValue.map(elem => ({
                ...elem,
                product: elem.product as ProductItem,
            }));

            saveTCardProductsHandler(cleaned);
            setEdited(false);
        }
    };

    const addProductHandler = () => {        
        const newProduct = {         
            code: "",
            qtu: 0,         
            mode: true,
            product: {} as ProductItem
        } as TCardProductItem;
        setTProductsValue([...tProductsValue, newProduct])
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
                    product={elem.product}
                    products={products}
                    code={elem.code}
                    qtu={elem.qtu}
                    changeProductHandler={changeProductHandler}
                    deleteProductHandler={deleteProductHandler}
                    index={index}
                />}
            {!edited && elem.product !== null && (elem.product) &&
                <TCardProduct
                    key={'products' + index}
                    product={elem.product}
                    code={elem.code}
                    qtu={elem.qtu}
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