// lib/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

// какие неймспейсы ты используешь
const NS = ['translation', 'ui', 'help', 'cookies'] as const

if (!i18n.isInitialized) {
    i18n
        .use(HttpBackend)        // грузим JSON с сервера
        .use(initReactI18next)   // подключаем react
        .init({
            lng: 'ru',
            fallbackLng: 'ru',
            ns: NS,
            defaultNS: 'translation',
            backend: {
                // файлы лежат в /public/locales/**, а паблик в Next доступен от корня '/'
                loadPath: '/locales/{{lng}}/{{ns}}.json',
            },
            interpolation: { escapeValue: false },
            react: { useSuspense: false }, // чтобы не ждать Suspense и не падать
            returnEmptyString: false,
        })
}

export default i18n

