// pages/billing/success.tsx
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

export default function Success() {
  const { t } = useTranslation()
  const router = useRouter()
  const { push } = router

  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (countdown <= 0) {
      push('/support')
      return
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, push])

  return (
    <div className="container_payments">
      <h1 className="title">Оплата принята 🎉</h1>
      <p className="text">Баланс будет обновлён в течение пары секунд.</p>
      <button
        className="back_button"
        onClick={() => push('/support')}
      >
        Возврат ({countdown})
      </button>
    </div>
  )
}
