
import '@/styles/globals.scss';
import '@/styles/index.scss';
import '@/styles/cards.scss';
import '@/styles/planing.scss';
import '@/styles/resources.scss';
import '@/styles/monitor.scss';
import '@/styles/support.scss';

import { store, persistor } from '@/store'  // теперь работает

import "reflect-metadata"

import type { AppProps } from 'next/app'
import React, { StrictMode, Suspense} from 'react';
import '@/lib/globalFetch'
// это пакет редукс
import { Provider, useDispatch } from 'react-redux';
// это набор утилит для редукс облегчающий его настройку
// import { configureStore, combineReducers } from '@reduxjs/toolkit';
// import {authSlice, catalogSlice,  dataSlice, planSlice, viewSlice} from '@/store/slices';

// import {
//   persistReducer,
//   persistStore,
//   FLUSH,
//   REHYDRATE,
//   PAUSE,
//   PERSIST,
//   PURGE,
//   REGISTER,
// } from 'redux-persist';

// // storage
// import storageSession from 'redux-persist/lib/storage/session'
// // import storage from 'redux-persist/lib/storage';
import { PersistGate } from 'redux-persist/integration/react'

// export const rootReducer = combineReducers({
//   authSlice: authSlice.reducer,
//   catalogSlice: catalogSlice.reducer,
//   dataSlice: dataSlice.reducer,  
//   planSlice: planSlice.reducer,  
//   viewSlice: viewSlice.reducer,  
// });

// // key нужен чтобы создавать несколько хранилищ
// const persistConfig = {
//   key: 'root',
//   storage: storageSession,  
  
//   whitelist: ['authSlice', 'catalogSlice', 'dataSlice','planSlice','viewSlice'],
//   // timeout: 1000,
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer)

// export const store = configureStore({
//   reducer: persistedReducer,
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//       // serializableCheck: {
//       //   ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
//       // },
//     }),
// })

// export const persistor = persistStore(store)

export default function App({ Component, pageProps }: AppProps) {

  return <>
    <Provider store={store}>
      <StrictMode>
        <Suspense fallback="...loading">
          <PersistGate loading={null} persistor={persistor}>
            <Component {...pageProps} />
          </PersistGate>
        </Suspense>
      </StrictMode>
    </Provider>
  </>
}
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;