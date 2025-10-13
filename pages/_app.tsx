
// pages/_app.tsx
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
import '@/styles/payments.scss';

import { store, persistor } from '@/store';

import 'reflect-metadata';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/client/i18n.client';

import type { AppProps } from 'next/app';

import '../lib/client/globalFetch';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PollingWrapper } from '@/components/PollingWrapper/pollingWrapper';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <I18nextProvider i18n={i18n}>
          <PollingWrapper>             
            <Component {...pageProps} />
          </PollingWrapper>
        </I18nextProvider>
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
