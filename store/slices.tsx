import { UOMItem, ActionItem, TCardItem,TCardProductItem, TCardOperationItem } from '@/types';
import { createSlice } from '@reduxjs/toolkit';



export type CatalogState = {
    uoms: UOMItem[],
    actions: ActionItem[]
}

export type DataState = {
    tCards: TCardItem[],
    tCardCurrent: TCardItem,
    tCardCurrentProducts: TCardProductItem[], // для текущей карты
    tCardCurrentWastes: TCardProductItem[],   // для текущей карты
    tCardCurrentOperations: TCardOperationItem[], // для текущей карты
    tCardCurrentMaterials: TCardProductItem[], // для текущей карты
}
// export type TextState = {   

// }
export type AuthState = {
    x: number
}
// export type StatState = {

// }
// // для хранения взаимодействия между тутором и студентом
// export type TutorState = {

// }

const catalogIntialState: CatalogState = {
    uoms: [],
    actions: [],
}
const dataIntialState: DataState = {
    tCards: [],
    tCardCurrent:{} as TCardItem,
    tCardCurrentProducts: [],
    tCardCurrentWastes: [],
    tCardCurrentOperations: [],
    tCardCurrentMaterials: [],
}
// const textIntialState: TextState = {       
// }
const authIntialState: AuthState = {
    x: 1
}
// const statIntialState: StatState = {
// }

// const tutorIntialState: TutorState = {
// }

// const playSlice = createSlice({
//     name: 'play',
//     initialState: playIntialState,
//     reducers: {

//     },

// })

// const textSlice = createSlice({
//     name: 'text',
//     initialState: textIntialState,
//     reducers: {

//     },

// })
const authSlice = createSlice({
    name: 'auth',
    initialState: authIntialState,
    reducers: {

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
    },

})
// const tutorSlice = createSlice({
//     name: 'tutor',
//     initialState: tutorIntialState,
//     reducers: {

//     },

// })

export default function Foo() { return <></> }  // пустышка для билда

export const { setActions, setUOMs } = catalogSlice.actions;
export const {setTCards,setTCardCurrent,setTCardCurrentMaterials,setTCardCurrentOperations,setTCardCurrentProducts,settCardCurrentWastes} = dataSlice.actions;

// export const {} = statSlice.actions;
// export const {} = textSlice.actions;

export const {} = authSlice.actions;

// export const {} = tutorSlice.actions;


export {
    authSlice, catalogSlice, dataSlice, 
    //textSlice, statSlice, tutorSlice 
};

