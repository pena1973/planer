import {
    UOMItem, ActionItem, UnitItem, SettingsItem,
    TCardItem,  UnitLoadItem, ScheduleItem,
    UnitExceptionItem, UnitActionItem, UserItem,
    TeamItem,TemplateItem,ProductItem
} from './../types/types';
import { BanerItem } from './../types/service-types';

import { createSlice } from '@reduxjs/toolkit';

// типы
export type CatalogState = {
    team: TeamItem,
    uoms: UOMItem[],
    actions: ActionItem[],
    units: UnitItem[],
    settings: SettingsItem,
    schedule: ScheduleItem,    
}
export type DataState = {
    tCards: TCardItem[],
    tCardIndex:number,
    templates:TemplateItem[],        
}
export type AuthState = {
    token: string,
    user: UserItem,
    signedAgreement:boolean,
    unit:UnitItem,
}


export type PlanState = {
    tCardLighted: TCardItem,
    tCardPrepared: TCardItem,
    unitLoads: UnitLoadItem[],
    unitExceptions: UnitExceptionItem[]
    unitActions: UnitActionItem[]

}
export type ViewState = {
    monitorPoint: number,
    resourcePoint: number,
    suportPoint: number,
    loadingComplete:boolean
    baner:BanerItem[],
    activeTeam:boolean,
    step:number,
}
  // 1-регистер
  // 2-логин
  // 3-соглашение
  // 4-лоадер
  // 5-мастер заполнения

// Начальное состояние
const catalogIntialState: CatalogState = {
    team: {} as TeamItem,
    uoms: [] as UOMItem[],
    actions: [] as ActionItem[],
    units: [] as UnitItem[],
    settings: {} as SettingsItem,
    schedule: {} as ScheduleItem,
    
}
const dataIntialState: DataState = {
    tCards: [] as TCardItem[],        
    tCardIndex:0,
    templates:[] as TemplateItem[],        
}
const authIntialState: AuthState = {
    token: "",
    user: {} as UserItem,
    signedAgreement:false,
    unit: {} as UnitItem,
}
const planIntialState: PlanState = {
    tCardLighted: {} as TCardItem,
    tCardPrepared: {} as TCardItem,
    unitLoads: [] as UnitLoadItem[],
    unitExceptions: [] as UnitExceptionItem[],
    unitActions: [] as UnitActionItem[],
}
// состояние открытых окон
const viewIntialState: ViewState = {
    monitorPoint: 1,
    resourcePoint: 1,
    suportPoint: 1,
    loadingComplete:false,
    baner: [] as BanerItem[],
    activeTeam:false,
    step:2,
}
// хранилище
const authSlice = createSlice({
    name: 'auth',
    initialState: authIntialState,
    reducers: {
        setToken: (state, action) => {
            state.token = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setSignedAgreement: (state, action) => {
            state.signedAgreement = action.payload;
        },
        setUnit: (state, action) => {
            state.unit = action.payload;
        },
    },
})

const catalogSlice = createSlice({
    name: 'catalog',
    initialState: catalogIntialState,
    reducers: {
        //  каталог операций
        setTeam: (state, action) => {
            state.team = action.payload;
        },
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
        setSettings: (state, action) => {
            state.settings = action.payload;
        },

        setSchedule: (state, action) => {
            state.schedule = action.payload;
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
        setTCardIndex: (state, action) => {
            state.tCardIndex = action.payload;
        }, 
        setTemplates: (state, action) => {
            state.templates = action.payload;
        },
               

    },

})

const planSlice = createSlice({
    name: 'plan',
    initialState: planIntialState,
    reducers: {
        setTCardLighted: (state, action) => {
            state.tCardLighted = action.payload;
        },
        setTCardPrepared: (state, action) => {
            state.tCardPrepared = action.payload;
        },
        setUnitLoads: (state, action) => {
            state.unitLoads = action.payload;
        },
        setUnitExceptions: (state, action) => {
            state.unitExceptions = action.payload;
        },
        setUnitActions: (state, action) => {
            state.unitActions = action.payload;
        },

    },

})
const viewSlice = createSlice({
    name: 'view',
    initialState: viewIntialState,
    reducers: {
        setMonitorPoint: (state, action) => {
            state.monitorPoint = action.payload;
        },
        setResourcePoint: (state, action) => {
            state.resourcePoint = action.payload;
        },
        setSuportPoint: (state, action) => {
            state.suportPoint = action.payload;
        },
        setLoadingComplete: (state, action) => {
            state.loadingComplete = action.payload;
        },        
        setBaner: (state, action) => {
            state.baner = action.payload;
        },
        setActiveTeam: (state, action) => {
            state.activeTeam = action.payload;
        },
          setStep: (state, action) => {
            state.step = action.payload;
        },
        
    },

})

export default function Foo() { return <></> }  // пустышка для билда

export const {setTeam, setActions, setUOMs, setUnits, setSettings, setSchedule } = catalogSlice.actions;
export const { setTCards,setTCardIndex, setTemplates } = dataSlice.actions;
export const { setToken, setUser,setSignedAgreement,setUnit} = authSlice.actions;
export const { setTCardLighted, setTCardPrepared, setUnitLoads, setUnitExceptions,setUnitActions } = planSlice.actions;
export const { setMonitorPoint, setResourcePoint,setSuportPoint,setLoadingComplete,setBaner,setActiveTeam,setStep } = viewSlice.actions;

export { authSlice, catalogSlice, dataSlice, planSlice, viewSlice };

