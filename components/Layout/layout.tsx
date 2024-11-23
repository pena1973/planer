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

export default function Layout({ children }: PropsWithChildren) {
    
    const [isActive, setIsActive] = useState(false);
    const { push, back } = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();



    return (
        <>
            <Head>
                <title>plan optimizer</title>
                <meta name="description" content="plan optimizer" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" type="image/x-icon" href="icon.ico"></link>

            </Head>

            <div className={styles.header}>
                <div className={styles.header_menu_groupe}>
                    <ul className={styles.header_menu}>
                        
                        <Link className={styles.header_menu_item} href="/">Optimizer</Link>
                        <Link className={styles.header_menu_item} href="/cards">Cards</Link>
                        <Link className={styles.header_menu_item} href="/planing">Planing</Link>
                        <Link className={styles.header_menu_item} href="/resources">Resources</Link>                        

                    </ul>
                </div>

                <div className={styles.profile_button}>
                    <button>логин</button>
                    <button>Профиль</button>
                </div>
            </div>
            <main className={styles.layout}>{children}</main>
        </>
    )
}