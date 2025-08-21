export interface BanerItem {

  message: string,
  locale: string
  dateFrom: string,
  dateTo: string,
}

export interface BillItem {
  id?: number,
  date: string; // период за который вымавлен счет
  title: string; // название счета в таблице, например за август 2023
  teamId: number; // id команды, для которой выдан счет
  paid: boolean; // оплачен ли счет
  amount?: number; // общая сумма счета
  client?: Party; // клиент, для которого выдан счет
  seller?: Party; // продавец, который выставил счет
  rows?: Array<{ id?: string; title: string; qty: number; amount: number,discount:number }>; // товары или услуги в счете
}
  

// types/invoice.ts
export interface Party {
  name: string;
  address: string;
  vat?: string;
}

export interface InvoiceItem {
  id: string;
  title: string;
  qty: number;
  price: number;
}

export interface InvoiceData {
  id: string;
  issueDate: string;   // ISO
  dueDate?: string;    // ISO
  seller: Party;
  buyer: Party;
  currency: string;    // 'EUR' и т.п.
  items: InvoiceItem[];
  notes?: string;
}

export interface ClientItem {  
   title: string; 
   reg_n: string; 
   adress: string; 
   email: string; 
   phone: string; 
   person: string;
}
