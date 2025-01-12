
import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import backend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
    .use(backend)
    .use(detector)
    .use(initReactI18next)
    .use(resourcesToBackend((language:string, namespace:string) => import(`./locales/${language}/${namespace}.json`)))
    .init({
        // debug: true,
         fallbackLng: 'en',
        returnEmptyString:false,
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });


export default i18n;