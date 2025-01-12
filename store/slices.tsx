import { UOMItem, ActionItem,UnitItem, 
    TCardItem,TCardProductItem, TCardOperationItem,TCardStageItem } from '@/types';
import { createSlice } from '@reduxjs/toolkit';

// типы
export type CatalogState = {
    uoms: UOMItem[],
    actions: ActionItem[]
    units: UnitItem[]
}
export type DataState = {
    tCards: TCardItem[],
    tCardCurrent: TCardItem,
    tCardCurrentStages:TCardStageItem[],// для текущей карты
    tCardCurrentProducts: TCardProductItem[], // для текущей карты
    tCardCurrentWastes: TCardProductItem[],   // для текущей карты
    tCardCurrentOperations: TCardOperationItem[], // для текущей карты
    tCardCurrentMaterials: TCardProductItem[], // для текущей карты
    tCardCurrentMaxIdc:number, //  счетчик id для текущей карты
}
export type AuthState = {
    token: string,
    userId: number,
    login: string, 
    role: string,
    nickname: string,
    agreeCookie:boolean,
    agreement:boolean,
    locale:string
}

// Начальное состояние
const catalogIntialState: CatalogState = {
    uoms: [] as UOMItem[],
    actions: [] as ActionItem[],
    units: [] as UnitItem[]
}
const dataIntialState: DataState = {
    tCards: [] as TCardItem[],
    tCardCurrent:{} as TCardItem,
    tCardCurrentStages:[] as TCardStageItem[],
    tCardCurrentProducts: [] as TCardProductItem[],
    tCardCurrentWastes: [] as TCardProductItem[],
    tCardCurrentOperations: [] as TCardOperationItem[],
    tCardCurrentMaterials: [] as TCardProductItem[],
    tCardCurrentMaxIdc:0,
}
const authIntialState: AuthState = {
    token: "",
    userId: 0,
    login: '',    
    role: "",
    nickname: "",
    agreeCookie:false,
    agreement:false,
    locale:"ru"
}

// хранилище
const authSlice = createSlice({
    name: 'auth',
    initialState: authIntialState,
    reducers: {       
        setLogin: (state, action) => {
            state.login = action.payload;
        },

        setToken: (state, action) => {
            state.token = action.payload;
        },
        setUserId: (state, action) => {
            state.userId = action.payload;
        },
        setRole: (state, action) => {
            state.role = action.payload;
        },
        setNickname: (state, action) => {
            state.nickname = action.payload;
        },
        setAgreeCookie: (state, action) => {
            state.agreeCookie = action.payload;
        },
        setAgreement: (state, action) => {
            state.agreement = action.payload;
        },      
        setLocale: (state, action) => {
            state.locale = action.payload;
        },              
    },
})

const catalogSlice = createSlice({
    name: 'catalog',
    initialState: catalogIntialState,
    reducers: {
        //  каталог операций
        setActions: (state, action) => {
            state.actions = action.payload;
        },
        //  каталог единиц измерения
        setUOMs: (state, action) => {
            state.uoms = action.payload;
        },
        //  каталог единиц измерения
        setUnits: (state, action) => {
            state.units = action.payload;
        },
    },

})

const dataSlice = createSlice({
    name: 'data',
    initialState: dataIntialState,
    reducers: {        
        setTCards: (state, action) => {
            state.tCards = action.payload;
        },
        setTCardCurrent: (state, action) => {
            state.tCardCurrent = action.payload;
        },     
        setTCardCurrentStages: (state, action) => {
            state.tCardCurrentStages = action.payload;
        },
        setTCardCurrentProducts: (state, action) => {
            state.tCardCurrentProducts = action.payload;
        },
        settCardCurrentWastes: (state, action) => {
            state.tCardCurrentWastes = action.payload;
        },        
        setTCardCurrentOperations: (state, action) => {
            state.tCardCurrentOperations = action.payload;
        },
        setTCardCurrentMaterials: (state, action) => {
            state.tCardCurrentMaterials = action.payload;
        },
        setTCardCurrentMaxIdc: (state, action) => {
            state.tCardCurrentMaxIdc = action.payload;
        },
        
    },

})
export default function Foo() { return <></> }  // пустышка для билда

export const { setActions, setUOMs,setUnits } = catalogSlice.actions;
export const {setTCards,setTCardCurrent,setTCardCurrentStages,setTCardCurrentMaterials,setTCardCurrentOperations,setTCardCurrentProducts,settCardCurrentWastes,setTCardCurrentMaxIdc} = dataSlice.actions;
export const {setToken,setLogin,setUserId,setRole,setNickname,setAgreeCookie,setAgreement, setLocale} = authSlice.actions;

export { authSlice, catalogSlice, dataSlice};

