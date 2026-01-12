
// export default i18n;
// lib/server/i18n.server.ts
import i18n, { Resource } from 'i18next';
// import { initReactI18next } from 'react-i18next';

import ruSerMes from '../../public/locales/ru/server_messages.json';
import enSerMes from '../../public/locales/en/server_messages.json';
import lvSerMes from '../../public/locales/lv/server_messages.json';

// Защита от случайного импорта на клиент
if (typeof window !== 'undefined') {
  throw new Error('Attempted to import server i18n on the client');
}

const NS = ['sermes'] as const;

const resources: Resource = {
  ru: {
    sermes: ruSerMes,
  },
  en: {
    sermes: enSerMes,
  },
  lv: {
    sermes: lvSerMes,
  },
};

if (!i18n.isInitialized) {
  i18n
    // .use(initReactI18next)
    .init({
      lng: 'en',
      fallbackLng: 'en',
      ns: NS,
      defaultNS: 'sermes',
      resources,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      returnEmptyString: false,
      initImmediate: false, // ← ВАЖНО: синхронная инициализация на сервере
    });
}

export default i18n;

export function getServerT(locale: string, ns: 'sermes' = 'sermes') {
  const lang = locale === 'en' ? 'en' : 'ru'; // жёстко нормализуем
  return i18n.getFixedT(lang, ns);
}