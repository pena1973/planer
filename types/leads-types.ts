export type LeadStatus =
    | "new"
    | "viewed"
    | "contacted"
    | "qualified"
    | "lost"
    | "spam";

export type LeadSource =
    | "landing"        // форма на лендинге
    | "widget"         // виджет на сайте/блоге
    | "trial_signup"   // регистрация в продукте
    | "support_chat"   // чат поддержки
    | "ad_google"      // реклама Google
    | "ad_facebook"    // реклама Facebook/Meta
    | "email"
    | "referral"
    | "manual"         // вручную добавленный лид
    | "other";



export interface LeadItem {
    source: LeadSource;  // источник лида
    type: "consultation";   // тип лида (можешь расширить enum'ом)
    name: string;
    email: string;
    company: string;
    time: string;          // "вт 11:00–13:00, Europe/Riga"
    message: string;
    agree: boolean;         // чекбокс согласия  
    locale: string;        // 'ru' | 'en' | ...
    tz: string;            // 'Europe/Riga'  
    hcaptchaToken: string; // если подключишь hCaptcha
    leadStatus: LeadStatus; // необязательное поле для статуса лида
}
