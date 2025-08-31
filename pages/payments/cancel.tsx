// pages/billing/cancel.tsx
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Cancel() {
  const router = useRouter()
  const { push } = router

  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (countdown <= 0) {
      push('/support') // сюда перенаправляем после отмены
      return
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, push])

  return (
    <div className="container_payments">
      <h1 className="title">Оплата отменена ❌</h1>
      <p className="text">Вы можете попробовать снова.</p>
      <button
        className="back_button"
        onClick={() => push('/support')}
      >
        Возврат ({countdown})
      </button>
    </div>
  )
}
