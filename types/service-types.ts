export interface BanerItem {

  message: string,
  locale: string
  dateFrom: string,
  dateTo: string,
}
export interface InvoiceItem {
  id?: number,
  date: string, // период за который вымавлен счет  
  invoice: string,
  amount: number,
  currency: string,
  // link:string, // ссылка на инвойс в страйп    
}
export interface UsageItem {
  teamId: number,
  date: string,
  amount: number,
  coment: string,
  id?: number,
  direction?: string; // направление приход/расход
  is_gift?: boolean; // это подарочный баланс?
}
export type JobScheduleType = 'monthly' | 'daily' | 'hourly' | 'every_x_minutes';

export interface JobSettingItem {
  job_key: string;
  enabled: boolean;
  timezone: string;
  schedule_type: JobScheduleType;
  monthly_day?: number | null;
  monthly_end_of_month?: boolean;
  daily_time?: string | null;     // 'HH:mm'
  hourly_minute?: number | null;  // 0..59
  every_minutes?: number | null;  // >0
  next_run_at?:string,
  last_run_at?:string
}

export interface ClientItem {
  title: string,
  reg_n: string,
  address_line1: string,
  address_line2: string,
  city: string,
  postal_code: string,
  email: string,
  phone: string,
  teamId: number,
  country: string,
  stripe_customer_id: string,
}
export interface MainItem {
  title: string,
  reg_n: string,
  country: string,
  address_line1: string,
  address_line2: string,
  city: string,
  postal_code: string,
  email: string,
  phone: string,
  person: string,
  price: number,         // decimal -> number (через transformer)
  discount: number,      // 0..100 (%)
  from: string,          // 'YYYY-MM-DD'
  VAT: number    // %

}

export enum LogLevelEnum {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  DEBUG = "debug",
}

export enum LogOriginEnum {
  SERVER = "server",
  CLIENT = "client",
}
