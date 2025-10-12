
// export default i18n;
// lib/server/i18n.server.ts
import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

// JSON-ресурсы (нужно "resolveJsonModule": true в tsconfig)
import ruTranslation from '../../public/locales/ru/translation.json';
import ruUi from '../../public/locales/ru/ui.json';
import ruHelp from '../../public/locales/ru/help.json';
import ruCookies from '../../public/locales/ru/cookies.json';

import enTranslation from '../../public/locales/en/translation.json';
import enUi from '../../public/locales/en/ui.json';
import enHelp from '../../public/locales/en/help.json';
import enCookies from '../../public/locales/en/cookies.json';

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

export function getServerT(locale: string, ns: 'translation' | 'ui' | 'help' | 'cookies'| 'server.messages' = 'translation') {
  const lang = locale === 'ru' ? 'ru' : 'en'; // жёстко нормализуем
  return i18n.getFixedT(lang, ns);
}