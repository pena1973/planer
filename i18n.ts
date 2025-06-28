
import i18n from "i18next";
import detector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18n
  .use(HttpBackend) // ✅ грузит переводы через HTTP
  .use(detector)
  .use(initReactI18next)
  .init({
    // debug: true,
    fallbackLng: "en",
    ns: ["translation", "help","cookies","ui"],
    defaultNS: "translation",
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json", // ✅ путь к public
    },
  });

export default i18n;
