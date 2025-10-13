
// export default i18n;
// lib/server/i18n.server.ts
import i18n, { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';

// JSON-ресурсы (нужно "resolveJsonModule": true в tsconfig)

import ruSerMes from '../../public/locales/ru/server_messages.json';
import enSerMes from '../../public/locales/en/server_messages.json';


const NS = ['sermes'] as const;

const resources: Resource = {
  ru: {    
    sermes: ruSerMes,
  },
  en: {    
    sermes: enSerMes,
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      lng: 'ru',
      fallbackLng: 'ru',
      ns: NS,
      defaultNS: 'sermes',
      resources, // ← единый набор ресурсов, без HttpBackend/require
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      returnEmptyString: false,
    });
}

export default i18n;

export function getServerT(locale: string, ns: 'sermes' = 'sermes') {
  const lang = locale === 'ru' ? 'ru' : 'en'; // жёстко нормализуем
  return i18n.getFixedT(lang, ns);
}