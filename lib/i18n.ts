// // lib/i18n.ts
// import i18n from 'i18next'
// import { initReactI18next } from 'react-i18next'
// import HttpBackend from 'i18next-http-backend'

// // какие неймспейсы ты используешь
// const NS = ['translation', 'ui', 'help', 'cookies'] as const

// if (!i18n.isInitialized) {
//     i18n
//         .use(HttpBackend)        // грузим JSON с сервера
//         .use(initReactI18next)   // подключаем react
//         .init({
//             lng: 'ru',
//             fallbackLng: 'ru',
//             ns: NS,
//             defaultNS: 'translation',
//             backend: {
//                 // файлы лежат в /public/locales/**, а паблик в Next доступен от корня '/'
//                 loadPath: '/locales/{{lng}}/{{ns}}.json',
//             },
//             interpolation: { escapeValue: false },
//             react: { useSuspense: false }, // чтобы не ждать Suspense и не падать
//             returnEmptyString: false,
//         })
// }

// export default i18n

// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

const NS = ['translation','ui','help','cookies'] as const;
const isServer = typeof window === 'undefined';

if (!i18n.isInitialized) {
  if (isServer) {
    // SSR: грузим ресурсы напрямую из файлов, без fetch
    const resources: any = {
      ru: {},
      en: {},
    };
    for (const ns of NS) {
      try { resources.ru[ns] = require(`../public/locales/ru/${ns}.json`); } catch {}
      try { resources.en[ns] = require(`../public/locales/en/${ns}.json`); } catch {}
    }

    i18n
      .use(initReactI18next)
      .init({
        lng: 'ru',
        fallbackLng: 'ru',
        ns: NS,
        defaultNS: 'translation',
        resources,                // ← без HttpBackend
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
        returnEmptyString: false,
      });
  } else {
    // Клиент: можно грузить через HttpBackend
    i18n
      .use(HttpBackend)
      .use(initReactI18next)
      .init({
        lng: 'ru',
        fallbackLng: 'ru',
        ns: NS,
        defaultNS: 'translation',
        backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
        interpolation: { escapeValue: false },
        react: { useSuspense: false },
        returnEmptyString: false,
      });
  }
}

export default i18n;
