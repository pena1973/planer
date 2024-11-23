import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./layout.module.scss";

import {

} from '@/store/slices';

import Head from "next/head";
import Image from 'next/image';
import Link from 'next/link';
// import clouds from "./cloud.module.css";
// import header1 from "./header.module.scss";


import { useRouter, usePathname } from 'next/navigation';


const locales = ['en', 'lv', 'ru', 'ua'];




const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export default function TCard() {
    
    const [isActive, setIsActive] = useState(false);
    const { push, back } = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();



    return (
        <>
            
        </>
    )
}