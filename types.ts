export interface TCardOperationItem {
    stage:string, // для визуальной прорисовки
    id: number, 
    out: TCardProductItem[],
    inn: TCardProductItem[],
    action: ActionItem,
    duration:number, // в милисекундах   
    mode?:boolean // для целей редактирования на форме
}

export interface TCardProductItem{
    id:number, 
    code:string,
    qtu:number, 
    uom:UOMItem,
    mode?:boolean // для целей редактирования на форме
}
export interface TCardItem{
    id:number, 
    date: Date, //  дата 
    mode?:boolean // для целей редактирования на форме
    number: string, // поле для синхронизации с внешними системами
    tCardProducts?: TCardProductItem[],
    tCardWastes?: TCardProductItem[],
    tCardOperations?: TCardOperationItem[],
    tCardMaterials?: TCardProductItem[],
}

export interface UOMItem{
   id:number, 
   title:string
}
export interface ActionItem{
    id:number, 
    title:string
 }