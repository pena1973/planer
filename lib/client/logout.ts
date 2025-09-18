import 'client-only'
// import {
//     UOMItem, ActionItem, UnitItem, SettingsItem,
//     TCardItem, UnitLoadItem, ScheduleItem,
//     UnitExceptionItem, UserItem,
//     TeamItem
// } from './../../types/types'

// import { store } from './../../store'
// import {
//   setToken,
//   setUser,
//   setTeam,
//   setSettings,
//   setSignedAgreement,
//   setUnit
// } from './../../store/slices'

// import {
//   setActions,
//   setUOMs,
//   setUnits,
//   setTCards,
//   setTCardIndex,
//   setSchedule,
//   setUnitLoads,
//   setUnitExceptions
// } from './../../store/slices'

// import Router from 'next/router'

// export function logout(redirectTo = '/') {
//   console.warn('[AUTH] 🚪 Полный logout. Очищаем Redux...')

//   // authSlice
//   store.dispatch(setToken(''))
//   store.dispatch(setUser({} as UserItem))
//   store.dispatch(setTeam({} as TeamItem))
//   store.dispatch(setSettings({} as SettingsItem))
//   store.dispatch(setSignedAgreement(false))
//   store.dispatch(setUnit({} as UnitItem))

//   // dataSlice и другие
//   store.dispatch(setActions([] as ActionItem[]))
//   store.dispatch(setUOMs([] as UOMItem[]))
//   store.dispatch(setUnits([] as UnitItem[]))
//   store.dispatch(setTCards([] as TCardItem[]))
//   store.dispatch(setTCardIndex(0))
//   store.dispatch(setSchedule({} as ScheduleItem))
//   store.dispatch(setUnitLoads([] as UnitLoadItem[]))
//   store.dispatch(setUnitExceptions([] as UnitExceptionItem[]))




//   Router.push(redirectTo)
// }


// lib/logout.ts
import { store } from '@/store'
import { persistor } from '@/store'
import { resetApp } from '@/store/reset'

export async function logout(redirectTo = '/') {
  // Убрать HttpOnly refresh cookie (на локалке без Secure)
  try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { }

  // ⚠️ сохраняем признак принятия cookies до очистки
  let cookiesAccepted: string | null = null;
  if (typeof window !== "undefined") {
    try { cookiesAccepted = localStorage.getItem('cookiesAccepted'); } catch { }
  }

  // Сбросить redux-persist (sessionStorage) и стор
  try {
    persistor.pause();
    store.dispatch(resetApp());          // 🔥 откат стора к initialState
    await persistor.flush();             // записать текущее состояние
    await persistor.purge();             // удалить 'persist:root'
    persistor.persist();                 // перезапустить персист (не обязательно)
  } catch { }

  // На всякий случай очистим браузерные хранилища и видимые куки
  try { sessionStorage.clear(); } catch { }
  try { localStorage.clear(); } catch { }

  // ✅ возвращаем флаг, чтобы баннер куки остался скрыт
  try { if (cookiesAccepted) localStorage.setItem('cookiesAccepted', cookiesAccepted); } catch { }

  try {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const c of cookies) {
      const name = c.split('=')[0].trim();
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    }
  } catch { }

  // Жёсткий переход — гарантированно перезапустит приложение «чистым»
  if (typeof window !== 'undefined') window.location.replace(redirectTo);
}

