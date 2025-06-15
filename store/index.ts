import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { authSlice, catalogSlice, dataSlice, planSlice, viewSlice } from './slices'
import {
  persistReducer,
  persistStore,
} from 'redux-persist'
import storageSession from 'redux-persist/lib/storage/session'

const rootReducer = combineReducers({
  authSlice: authSlice.reducer,
  catalogSlice: catalogSlice.reducer,
  dataSlice: dataSlice.reducer,
  planSlice: planSlice.reducer,
  viewSlice: viewSlice.reducer,
})

const persistConfig = {
  key: 'root',
  storage: storageSession,
  whitelist: ['authSlice', 'catalogSlice', 'dataSlice', 'planSlice', 'viewSlice'],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
