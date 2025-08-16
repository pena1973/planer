import { PropsWithChildren, useState, useEffect, useRef } from "react";
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from "@/pages/_app";
import styles from "./layout.module.scss";
import { logout } from '@/lib/logout'
import { ScreenSizeModal } from '@/components/ScreenSizeWarning/ScreenSizeModal'
import CookieBanner from '@/components/CookieBanner/cookieBanner'

import home from "@/public/home1.png";

import Head from "next/head";
import Image from 'next/image';
import Link from 'next/link';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import '../../i18n'

const locales = ['en', 'ru'];

export default function Layout({ children }: PropsWithChildren) {
    const { t, i18n } = useTranslation();
    const { push, back } = useRouter();
    const pathname = usePathname();
    const dispatch = useAppDispatch();

    const loadingComplete = useSelector((state: RootState) => {
        return state.viewSlice.loadingComplete;
    })

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
        logout('/')
    }
    return (
        <>
            <Head>
                <title>PTPro</title>
                <meta name="description" content="plan optimizer" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" type="image/x-icon" href="icon.ico"></link>

            </Head>
            <CookieBanner />
            <div className={styles.header_menu_baner}> 
                17 августа с 22-00 по 23-00 по Рижскому времени будут производится технические работы, 
                возможно отключение сервиса, Приносим извинение за неудобства</div>
            <div className={styles.header}>
                <div className={styles.header_menu_groupe}>
                    <ul className={styles.header_menu}>

                        {(!user.id) && !loadingComplete && <Link className={styles.header_menu_item} href="/">
                            <Image className={styles.img} src={home} alt="home" />
                        </Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/cards">{t('layout.cards')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/planing">{t('layout.planing')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/resources">{t('layout.resources')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/monitor">{t('layout.monitor')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/support">{t('layout.support')}</Link>}
                        {(!user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/unit-interface">{t('layout.unit-interface')}</Link>}
                        {(!user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/unit-docs">{t('layout.unit-docs')}</Link>}
                        {(!user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/unit-profile">{t('layout.unit-profile')}</Link>}

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
                    {(user.id) && <button onClick={exit}>{t('layout.exit')}</button>}
                </div>
            </div>

            <main className={styles.layout}>{children}</main>
            {(user) && user.isAdmin && <ScreenSizeModal />}

        </>
    )
}