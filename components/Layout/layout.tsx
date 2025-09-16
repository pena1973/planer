import { PropsWithChildren, useState, useMemo, useRef } from "react";

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { RootState } from '@/store';
import styles from "./layout.module.scss";
import { logout } from '@/lib/client/logout'
import { ScreenSizeModal } from '@/components/ScreenSizeWarning/ScreenSizeModal'
import CookieBanner from '@/components/CookieBanner/cookieBanner'

import home from "@/public/home1.png";

import Head from "next/head";
import Image from 'next/image';
import Link from 'next/link';

// import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const locales = ['en', 'ru'];

export default function Layout({ children }: PropsWithChildren) {
    const { t, i18n } = useTranslation();
    // const { push, back } = useRouter();
    // const pathname = usePathname();
    // const dispatch = useAppDispatch();

    const loadingComplete = useAppSelector((state: RootState) => {
        return state.viewSlice.loadingComplete;
    })

    const user = useAppSelector((state: RootState) => {
        return state.authSlice.user;
    })
    //показывает текущее состояние активности команды
    const activeTeam = useAppSelector((state: RootState) => {
        return state.viewSlice.activeTeam;
    })

    const baner = useAppSelector((state: RootState) => {
        return state.viewSlice.baner;
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

    const viewBaner = useMemo(() => {        
        const curentBaner = baner?.find((item) => item.locale === i18n.resolvedLanguage);
        return curentBaner ? (curentBaner.message) : '';
    }, [baner, i18n.resolvedLanguage]);

    return (
        <>
            <Head>
                <title>PTPro</title>
                <meta name="description" content="plan optimizer" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <link rel="icon" type="image/x-icon" href="icon.ico"></link>

            </Head>
            <CookieBanner />
            <div className={styles.header_menu_baner}>{viewBaner}</div>
            <div className={styles.header}>
                <div className={styles.header_menu_groupe}>
                    <ul className={styles.header_menu}>
                        {(!user.id) && !loadingComplete && <Link className={styles.header_menu_item} href="/">
                            <Image className={styles.img} src={home} alt="home" />
                        </Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && activeTeam && <Link className={styles.header_menu_item} href="/cards">{t('layout.cards')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && activeTeam && <Link className={styles.header_menu_item} href="/planing">{t('layout.planing')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && activeTeam && <Link className={styles.header_menu_item} href="/resources">{t('layout.resources')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && activeTeam && <Link className={styles.header_menu_item} href="/monitor">{t('layout.monitor')}</Link>}
                        {(user.isAdmin) && (user.id) && !(!loadingComplete) && <Link className={styles.header_menu_item} href="/support">{t('layout.support')}</Link>}
                        {(!user.isAdmin) && (user.id) && !(!loadingComplete) && activeTeam && <Link className={styles.header_menu_item} href="/unit-interface">{t('layout.unit-interface')}</Link>}
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