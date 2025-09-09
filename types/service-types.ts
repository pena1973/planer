export interface BanerItem {

  message: string,
  locale: string
  dateFrom: string,
  dateTo: string,
}

export interface BillItem {
  id?: number,
  date: string; // период за который вымавлен счет
  dueDate: string,// оплатить до
  title: string; // название счета в таблице, например за август 2023
  teamId: number; // id команды, для которой выдан счет  
  amount: number; // общая сумма счета без НДС
  vat:number, // НДС в процентах
  vatAmount:number, // НДС в сумме
  totalAmount: number; // общая сумма счета c  НДС
  client: { title: string, address: string, reg_n: string, email: string, phone: string, person: string }, // клиент, для которого выдан счет
  seller: { title: string, address: string, reg_n: string, email: string, phone: string, person: string }; // продавец, который выставил счет
  rows: Array<{
    id?: number,
    billableTeamNumber: string;
    price: number,
    amount: number,
    discount: number,
    dateFrom: string,
    dateTo: string,
    activeDays: number
    carency:string,
  }>; // товары или услуги в счете
  coment: string
}


export interface ClientItem {
  title: string,
  reg_n: string,
  adress: string,
  email: string,
  phone: string,
  person: string,
  teamId: number,
}
export interface MainItem {
  title: string,
  reg_n: string,
  adress: string,        // оставляю имя поля как в сущности
  email: string,
  phone: string,
  person: string,
  price: number,         // decimal -> number (через transformer)
  discount: number,      // 0..100 (%)
  from: string,          // 'YYYY-MM-DD'
  VAT: number    // %
}