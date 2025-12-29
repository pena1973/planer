// pages/payments/success.tsx
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import { useState, useEffect } from 'react'

export default function Success() {
  const { t, i18n } = useTranslation()
  const router = useRouter()

  const { push, query, isReady } = router
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    if (!isReady) return
    const lng = typeof query.lng === 'string' ? query.lng : null
    if (lng && lng !== i18n.language) i18n.changeLanguage(lng)
  }, [isReady, query.lng, i18n])

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
      <h1 className="title">{t('bills.paymentAccepted')}🎉</h1>
      <p className="text">{t('bills.usageWillAdded')}</p>
      <button
        className="back_button"
        onClick={() => push('/support')
        }
      >
        {t('bills.paymentReturn')} ({countdown})

      </button>
    </div>
  )
}
