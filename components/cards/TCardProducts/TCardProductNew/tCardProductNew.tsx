import { useEffect, useState, useRef } from "react";
import styles from "./tCardProductNew.module.scss";
import { ProductItem } from '@/types/types'
import DropdownSelectProduct from '@/components/DropdownSelectProduct/dropdownSelectProduct';
import Image from 'next/image';
import del from "@/public/del2.png";


export interface TCardProductNewProps {
    product: ProductItem | null,
    products: ProductItem[],
    code: string,
    qtu: number,
    deleteProductHandler: (index: number) => void,
    changeProductHandler: (index: number, product: ProductItem | null, qtu: number) => void,
    index: number
}

export default function TCardProductNew({
    product,
    products,
    code,
    qtu,
    deleteProductHandler,
    changeProductHandler,
    index
}: TCardProductNewProps) {

    const [productValue, setProductValue] = useState<ProductItem | null>(null);
    const [qtuValue, setQtuValue] = useState(0);

    interface Option {
        idc: number;
        title: string;
    }

    const options = useRef([] as Option[]);
    // const [message, setMessage] = useState("");

    useEffect(() => {
        setProductValue(product)
        setQtuValue(qtu);
    }, [product, qtu]);

    useEffect(() => {
        options.current = products.map(p => { return { idc: p.idc, title: `${p.title}(${p.uom.title})` } });
    }, [products]);
   

    const handleSelectProduct = (option: Option | null) => {
        if (option === null) {
            setProductValue(null);
            changeProductHandler(index, null, qtuValue);
        } else {
            const product = products.find(p => p.idc === option.idc);
            const productValue_ = product ?? null;
            setProductValue(productValue_);
            changeProductHandler(index, productValue_, qtuValue);
        }
    };

    const idc = (productValue?.idc) ? productValue.idc : "";

    return (

        <div className={styles.container_row}>
            <Image className={styles.icon_del}
                src={del} alt="del" width={20} height={20}
                onClick={() => deleteProductHandler(index)}
            />
            <div className={styles.tCardProduct_code}>{"P" + idc} | {code}</div>

            <DropdownSelectProduct
                options={options.current}
                onSelect={handleSelectProduct}
                selectedValue={productValue ? productValue.idc : null}
            />

            <input className={styles.tCardProduct_qtu}
                id={"qtu" + idc} autoComplete="off"
                value={qtuValue} type="number"
                onChange={e => {
                    setQtuValue(Number(e.target.value));
                    changeProductHandler(index, productValue, Number(e.target.value))
                }}
            />

        </div>

    )
}