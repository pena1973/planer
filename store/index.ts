// import { configureStore, combineReducers } from '@reduxjs/toolkit'
// import { authSlice, catalogSlice, dataSlice, planSlice, viewSlice } from './slices'
// import {
//   persistReducer,
//   persistStore,
// } from 'redux-persist'
// import storageSession from 'redux-persist/lib/storage/session'

// const rootReducer = combineReducers({
//   authSlice: authSlice.reducer,
//   catalogSlice: catalogSlice.reducer,
//   dataSlice: dataSlice.reducer,
//   planSlice: planSlice.reducer,
//   viewSlice: viewSlice.reducer,
// })

// const persistConfig = {
//   key: 'root',
//   storage: storageSession,
//   whitelist: ['authSlice', 'catalogSlice', 'dataSlice', 'planSlice', 'viewSlice'],
// }

// const persistedReducer = persistReducer(persistConfig, rootReducer)

// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     }),
// })

// export const persistor = persistStore(store)

// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch


import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { authSlice, catalogSlice, dataSlice, planSlice, viewSlice } from './slices'
import { persistReducer, persistStore } from 'redux-persist'
import storageSession from 'redux-persist/lib/storage/session'
import type { AnyAction } from '@reduxjs/toolkit'
import { resetApp } from './reset'

const appReducer = combineReducers({
  authSlice: authSlice.reducer,
  catalogSlice: catalogSlice.reducer,
  dataSlice: dataSlice.reducer,
  planSlice: planSlice.reducer,
  viewSlice: viewSlice.reducer,
})

// ВАЖНО: перехватываем resetApp и откатываем дерево в initialState
const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: AnyAction) => {
  if (action.type === resetApp.type) {
    state = undefined; // все слайсы вернутся к своим initialState
  }
  return appReducer(state, action);
};

const persistConfig = {
  key: 'root',
  storage: storageSession,
  whitelist: ['authSlice', 'catalogSlice', 'dataSlice', 'planSlice', 'viewSlice'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
