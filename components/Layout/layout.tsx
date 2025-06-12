import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./layout.module.scss";

import {
    UOMItem, ActionItem, UnitItem, SettingsItem,
    TCardItem,  UnitLoadItem, ScheduleItem,
    UnitExceptionItem, UserItem,
    TeamItem
} from '@/types'

import {
    setTeam, setToken, setUser,
    setUnitExceptions, setActions,
    setUOMs, setUnits, setTCards,
    setSettings, setSchedule, setUnitLoads, setTCardIndex
} from '@/store/slices'

import Head from "next/head";
import Image from 'next/image';
import Link from 'next/link';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '../../i18n'

const locales = ['en', 'ru'];

const URL = process.env.NEXT_PUBLIC_URL;
let _url = String(URL);
_url = _url.concat((_url[_url.length - 1] === "/") ? "" : "/");

export default function Layout({ children }: PropsWithChildren) {
    const { t, i18n } = useTranslation();
    const { push, back } = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const user = useSelector((state: RootState) => {
        return state.authSlice.user;
    })

    // язык
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.resolvedLanguage);
    const toggleDropdown = () => {
        setDropdownOpen(!isDropdownOpen);
    };
    const selectLanguage = (locale: string) => {
        setSelectedLanguage(locale);
        setDropdownOpen(false);
        i18n.changeLanguage(locale);
    }
    const exit = () => {
        dispatch(setToken(""));
        dispatch(setUser({} as UserItem));
        dispatch(setTeam({} as TeamItem));
        dispatch(setUnitExceptions([] as UnitExceptionItem[]));
        dispatch(setActions([] as ActionItem[]));
        dispatch(setUOMs([] as UOMItem[]));
        dispatch(setUnits([] as UnitItem[]));
        dispatch(setTCards([] as TCardItem[]));
        dispatch(setTCardIndex(0 as number));
        dispatch(setSettings( {} as SettingsItem));
        dispatch(setSchedule({} as ScheduleItem));
        dispatch(setUnitLoads([] as UnitLoadItem[]));
        
        push("/");
    };

    return (
        <>
            <Head>
                <title>PTPro</title>
                <meta name="description" content="plan optimizer" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" type="image/x-icon" href="icon.ico"></link>

            </Head>

            <div className={styles.header}>
                <div className={styles.header_menu_groupe}>
                    <ul className={styles.header_menu}>

                        {(!user.id) && <Link className={styles.header_menu_item} href="/"></Link>}
                        {(user.id) && <Link className={styles.header_menu_item} href="/cards">{t('layout.cards')}</Link>}
                        {(user.id) && <Link className={styles.header_menu_item} href="/planing">{t('layout.planing')}</Link>}
                        {(user.id) && <Link className={styles.header_menu_item} href="/resources">{t('layout.resources')}</Link>}
                        {(user.id) && <Link className={styles.header_menu_item} href="/monitor">{t('layout.monitor')}</Link>}
                        {(user.id) && <Link className={styles.header_menu_item} href="/support">{t('layout.support')}</Link>}


                    </ul>
                </div>

                <div className={styles.profile_button}>
                    <div className={styles.languageButton_container}>

                        <button className={styles.languageButton} onClick={toggleDropdown}>
                            <span className="button_text_dark">{selectedLanguage}</span>
                        </button>

                        {isDropdownOpen && (
                            <div className={styles.languageList} >
                                {locales.map((elem, index) => (
                                    <div className={styles.languageItem} key={index} onClick={() => selectLanguage(elem)}>
                                        {elem}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>                    
                    {/* <button>{t('layout.profile')}</button> */}
                    {(user.id) &&  <button onClick={exit}>{t('layout.exit')}</button>}
                </div>
            </div>
            <main className={styles.layout}>{children}</main>
        </>
    )
}