// lib/globalFetch.ts
import { store } from './../store'
import { setToken } from './../store/slices'
import { logout } from './../lib/logout'

const originalFetch = global.fetch.bind(global)

// базовый URL для SSR (чтобы относительные превратить в абсолютные)
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.APP_BASE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : `http://localhost:${process.env.PORT || 3000}`)

function absUrl(url: string) {
  try {
    return new URL(url, BASE_URL).toString()
  } catch {
    return url
  }
}

function sameOrigin(url: string) {
  try {
    const u = new URL(url, BASE_URL)
    const b = new URL(BASE_URL)
    return u.origin === b.origin
  } catch {
    return false
  }
}

global.fetch = async function (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
      ? input.href
      : '[RequestObject]'

  // если это внешний домен (Resend, Stripe и т.д.) → не трогаем
  if (!sameOrigin(url)) {
    return originalFetch(input, init)
  }

  const token = store.getState().authSlice.token
  console.log(`[FETCH] → ${url}`)

  let res = await originalFetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: 'Basic ' + token,
      'Content-Type': 'application/json',
    },
  })

  if (res.status === 401 || res.status === 403) {
    console.warn(`[AUTH] ⛔ AccessToken истёк. Пробуем refresh...`)

    // refresh вызываем по абсолютному URL на сервере
    const refreshUrl =
      typeof window === 'undefined'
        ? absUrl('/api/auth/refresh-token')
        : '/api/auth/refresh-token'

    const refreshRes = await originalFetch(refreshUrl, { method: 'POST' })
    if (refreshRes.ok) {
      const { token: newToken } = await refreshRes.json()
      store.dispatch(setToken(newToken))

      console.info(`[AUTH] 🔁 Токен обновлён. Повторяем → ${url}`)

      res = await originalFetch(input, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          Authorization: 'Basic ' + newToken,
          'Content-Type': 'application/json',
        },
      })
    } else {
      console.error(`[AUTH] ❌ Refresh не сработал. Logout.`)
      logout('/?session=expired')
    }
  }

  return res
}
