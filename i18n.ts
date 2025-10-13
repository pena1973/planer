
import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(HttpBackend) // ✅ грузит переводы через HTTP
  .use(detector)
  .use(initReactI18next)
  .init({
    debug: false,
    fallbackLng: "en",
    ns: ["translation", "help", "cookies", "ui","client.messages","server.messages"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // ✅ путь к public
      requestOptions: {
        mode: 'no-cors',
      },
      silent: true,
    },

  });

const originalConsoleLog = console.log;
console.log = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('[FETCH] → /locales/')
  ) {
    return; // подавляем
  }
  originalConsoleLog(...args); // остальное оставляем
};

export default i18n;
