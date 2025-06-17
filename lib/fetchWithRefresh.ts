// lib/fetchWithRefresh.ts
let tokenGetter: (() => string | null) | null = null
let tokenSetter: ((token: string) => void) | null = null

export function configureTokenAccess(get: () => string | null, set: (token: string) => void) {
  tokenGetter = get
  tokenSetter = set
}

export async function fetchWithRefresh(input: RequestInfo, init: RequestInit = {}) {
  if (!tokenGetter || !tokenSetter) {
    throw new Error('Token access not configured')
  }

  const token = tokenGetter()
  let res = await fetch(input, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'Authorization': 'Basic ' + token,
      'Content-Type': 'application/json',
    },
  })

  if (res.status === 401 || res.status === 403) {
    const refreshRes = await fetch('/api/refresh-token')
    if (refreshRes.ok) {
      const { token: newToken } = await refreshRes.json()
      tokenSetter(newToken)
      res = await fetch(input, {
        ...init,
        headers: {
          ...(init.headers || {}),
          'Authorization': 'Basic ' + newToken,
          'Content-Type': 'application/json',
        },
      })
    }
  }

  return res
}
