import 'client-only'

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

