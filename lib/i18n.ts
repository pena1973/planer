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

// import ruTranslation from '../public/locales/ru/translation.json';
// import ruUi from '../public/locales/ru/ui.json';
// import ruHelp from '../public/locales/ru/help.json';
// import ruCookies from '../public/locales/ru/cookies.json';

// import enTranslation from '../public/locales/en/translation.json';
// import enUi from '../public/locales/en/ui.json';
// import enHelp from '../public/locales/en/help.json';
// import enCookies from '../public/locales/en/cookies.json';

// const resources: Resource = {
//   ru: {
//     translation: ruTranslation,
//     ui: ruUi,
//     help: ruHelp,
//     cookies: ruCookies,
//   },
//   en: {
//     translation: enTranslation,
//     ui: enUi,
//     help: enHelp,
//     cookies: enCookies,
//   },
// };

// import i18n, { Resource } from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import HttpBackend from 'i18next-http-backend';

// const NS = ['translation','ui','help','cookies'] as const;
// const isServer = typeof window === 'undefined';

// if (!i18n.isInitialized) {
//   if (isServer) {
//     // SSR: грузим ресурсы напрямую из файлов, без fetch
//     const resources: Resource  = {
//       ru: {},
//       en: {},
//     };
//     for (const ns of NS) {
//       try { resources.ru[ns] = require(`../public/locales/ru/${ns}.json`); } catch {}
//       try { resources.en[ns] = require(`../public/locales/en/${ns}.json`); } catch {}
//     }

//     i18n
//       .use(initReactI18next)
//       .init({
//         lng: 'ru',
//         fallbackLng: 'ru',
//         ns: NS,
//         defaultNS: 'translation',
//         resources,                // ← без HttpBackend
//         interpolation: { escapeValue: false },
//         react: { useSuspense: false },
//         returnEmptyString: false,
//       });
//   } else {
//     // Клиент: можно грузить через HttpBackend
//     i18n
//       .use(HttpBackend)
//       .use(initReactI18next)
//       .init({
//         lng: 'ru',
//         fallbackLng: 'ru',
//         ns: NS,
//         defaultNS: 'translation',
//         backend: { loadPath: '/locales/{{lng}}/{{ns}}.json' },
//         interpolation: { escapeValue: false },
//         react: { useSuspense: false },
//         returnEmptyString: false,
//       });
//   }
// }

// export default i18n;
// lib/i18n.ts
import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

// JSON-ресурсы (нужно "resolveJsonModule": true в tsconfig)
import ruTranslation from '../public/locales/ru/translation.json';
import ruUi from '../public/locales/ru/ui.json';
import ruHelp from '../public/locales/ru/help.json';
import ruCookies from '../public/locales/ru/cookies.json';

import enTranslation from '../public/locales/en/translation.json';
import enUi from '../public/locales/en/ui.json';
import enHelp from '../public/locales/en/help.json';
import enCookies from '../public/locales/en/cookies.json';

const NS = ['translation', 'ui', 'help', 'cookies'] as const;

const resources: Resource = {
  ru: {
    translation: ruTranslation,
    ui: ruUi,
    help: ruHelp,
    cookies: ruCookies,
  },
  en: {
    translation: enTranslation,
    ui: enUi,
    help: enHelp,
    cookies: enCookies,
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      lng: 'ru',
      fallbackLng: 'ru',
      ns: NS,
      defaultNS: 'translation',
      resources, // ← единый набор ресурсов, без HttpBackend/require
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      returnEmptyString: false,
    });
}

export default i18n;
