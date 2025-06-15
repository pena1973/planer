// lib/globalFetch.ts
import { store } from '@/store'
import { setToken, setUser, setTeam, setSignedAgreement, setSettings, setUnit } from '@/store/slices'
import { logout } from '@/lib/logout'
const originalFetch = global.fetch.bind(global)

// function logout() {
//   console.warn('[AUTH] 🚪 Logout — сбрасываем токен и данные')
//   store.dispatch(setToken(null))
//   store.dispatch(setUser(null))
//   store.dispatch(setTeam(null))
//   store.dispatch(setSettings(null))
//   store.dispatch(setSignedAgreement(false))
//   store.dispatch(setUnit(null))

//   // можно показать сообщение:
//   if (typeof window !== 'undefined') {
//     alert('Сессия истекла. Пожалуйста, войдите снова.')
//     // Перенаправить на логин:
//     window.location.href = '/?session=expired'
//   }
// }

global.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : '[RequestObject]'
    const token = store.getState().authSlice.token

    console.log(`[FETCH] → ${url}`)

    let res = await originalFetch(input, {
        ...init,
        headers: {
            ...(init?.headers || {}),
            'Authorization': 'Basic ' + token,
            'Content-Type': 'application/json',
        },
    })

    if (res.status === 401 || res.status === 403) {
        console.warn(`[AUTH] ⛔ AccessToken истёк. Пробуем refresh...`)

        const refreshRes = await originalFetch('/api/refresh-token')
        if (refreshRes.ok) {
            const { token: newToken } = await refreshRes.json()
            store.dispatch(setToken(newToken))

            console.info(`[AUTH] 🔁 Токен обновлён. Повторяем → ${url}`)

            res = await originalFetch(input, {
                ...init,
                headers: {
                    ...(init?.headers || {}),
                    'Authorization': 'Basic ' + newToken,
                    'Content-Type': 'application/json',
                },
            })
        } else {
            console.error(`[AUTH] ❌ Refresh не сработал. Logout.`)
            logout('/?session=expired')
            //   logout()
        }
    }

    return res
}
