import {
    UOMItem, ActionItem, UnitItem, SettingsItem,
    TCardItem, TCardProductItem, TCardOperationItem, TCardStageItem, UnitLoadItem, ScheduleItem,
    UnitExceptionItem, UnitActionItem, UserItem,
    TeamItem
} from '@/types';
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
    tCardCurrentId: number,
    tCardCurrent: TCardItem,
    tCardCurrentStages: TCardStageItem[],// для текущей карты
    tCardCurrentProducts: TCardProductItem[], // для текущей карты
    tCardCurrentWastes: TCardProductItem[],   // для текущей карты
    tCardCurrentOperations: TCardOperationItem[], // для текущей карты
    tCardCurrentMaterials: TCardProductItem[], // для текущей карты
    tCardCurrentMaxIdc: number, //  счетчик id для текущей карты
}
export type AuthState = {
    token: string,
    user: UserItem,
    signedAgreement:boolean,
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
}
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
    tCardCurrentId: NaN,
    tCardCurrent: {} as TCardItem,
    tCardCurrentStages: [] as TCardStageItem[],
    tCardCurrentProducts: [] as TCardProductItem[],
    tCardCurrentWastes: [] as TCardProductItem[],
    tCardCurrentOperations: [] as TCardOperationItem[],
    tCardCurrentMaterials: [] as TCardProductItem[],
    tCardCurrentMaxIdc: 0,
}
const authIntialState: AuthState = {
    token: "",
    user: {} as UserItem,
    signedAgreement:false,
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
        setTCardCurrentId: (state, action) => {
            state.tCardCurrentId = action.payload;
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

    },

})

export default function Foo() { return <></> }  // пустышка для билда

export const {setTeam, setActions, setUOMs, setUnits, setSettings, setSchedule } = catalogSlice.actions;
export const { setTCards,setTCardCurrentId, setTCardCurrent, setTCardCurrentStages, setTCardCurrentMaterials, setTCardCurrentOperations, setTCardCurrentProducts, settCardCurrentWastes, setTCardCurrentMaxIdc } = dataSlice.actions;
export const { setToken, setUser,setSignedAgreement} = authSlice.actions;
export const { setTCardLighted, setTCardPrepared, setUnitLoads, setUnitExceptions,setUnitActions } = planSlice.actions;
export const { setMonitorPoint, setResourcePoint } = viewSlice.actions;

export { authSlice, catalogSlice, dataSlice, planSlice, viewSlice };

