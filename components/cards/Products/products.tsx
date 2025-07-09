
import styles from "./products.module.scss";
import { ProductItem, UOMItem } from '@/types/types'
import Image from 'next/image';

import Product from "@/components/cards/Product/product";
import ProductNew from "@/components/cards/ProductNew/productNew";

import { useEffect, useState, useRef } from "react";

import edit from "@/public/edit-rem.png";
import save from "@/public/save-rem.png";
import add from "@/public/add-rem.png";

export interface TCardProductsProps {
    products: ProductItem[],
    saveProductsHandler: (products: ProductItem[]) => void;
    updateIdc: (currentId: number) => void,
    maxIdc: number,
    setMaxIdc: (maxIdc: number) => void,
}

export default function TCardProducts({
    products,
    saveProductsHandler,
    maxIdc,
    setMaxIdc,
}: TCardProductsProps) {

    const [edited, setEdited] = useState(false);
    const [productsValue, setProductsValue] = useState([] as ProductItem[]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        setProductsValue(products);
    }, [products]);

    // колбеки кнопки
    const deleteProductHandler = (indexToRemove: number) => {
        const productsValueUpdated = [...productsValue]
        productsValueUpdated.splice(indexToRemove, 1)
        setProductsValue(productsValueUpdated)
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

        return (<>
            {edited &&
                <ProductNew
                    key={'prod' + index}
                    idc={elem.idc}
                    title={elem.title}
                    uom={elem.uom}
                    sync={elem.sync}
                    changeProductHandler={changeProductHandler}
                    deleteProductHandler={deleteProductHandler}
                    index={index}
                />}
            {!edited &&
                <Product
                    key={'prod' + index}
                    idc={elem.idc}
                    title={elem.title}
                    uom={elem.uom}
                    sync={elem.sync}
                />}
        </>
        );
    })

    return (

        <div className={styles.container}>
            {productsReactNodes}

            <>
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
            </>

        </div>



    )
}