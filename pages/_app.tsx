
import '@/styles/globals.scss';
import '@/styles/index.scss';
import '@/styles/cards.scss';
import '@/styles/planing.scss';
import '@/styles/resources.scss';
import '@/styles/monitor.scss';
import '@/styles/support.scss';
import '@/styles/cookies-policy.scss';
import '@/styles/unit-interface.scss';
import '@/styles/admin.scss';


import { store, persistor } from '@/store'  // теперь работает

import "reflect-metadata"

import type { AppProps } from 'next/app'
import React, { StrictMode, Suspense } from 'react';
import '../lib/globalFetch'
// это пакет редукс
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react'
import {PollingWrapper} from "@/components/PollingWrapper/pollingWrapper";

// export default function App({ Component, pageProps }: AppProps) {

//   return <>
//     <Provider store={store}>
//       <StrictMode>
//         <Suspense fallback="...loading">
//           <PersistGate loading={null} persistor={persistor}>
//             <Component {...pageProps} />
//           </PersistGate>
//         </Suspense>
//       </StrictMode>
//     </Provider>
//   </>
// }
// export type RootState = ReturnType<typeof store.getState>
// export type AppDispatch = typeof store.dispatch;
// export const useAppDispatch: () => AppDispatch = useDispatch;


export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <StrictMode>
        <Suspense fallback="...loading">
          <PersistGate loading={null} persistor={persistor}>
            <PollingWrapper>
              <Component {...pageProps} />
            </PollingWrapper>
          </PersistGate>
        </Suspense>
      </StrictMode>
    </Provider>
  );
}


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
