export type LeadStatus =
    | "new"    
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
    id?: number;
    date: string;
    source: LeadSource;   // источник лида    
    name: string;
    email: string;
    company: string;
    time: string;          
    message: string;
    agree: boolean;       
    locale: string;       
    hcaptchaToken?: string; // если подключишь hCaptcha
    status: LeadStatus; 
}
