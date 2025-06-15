import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './сookieBanner.module.scss'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const { t } = useTranslation('cookies')

  useEffect(() => {
    const agreed = localStorage.getItem('cookiesAccepted')
    if (!agreed) setVisible(true)
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className={styles.banner}>
      <p className="text-sm">
        {t('text')} <a href="/cookies-policy">{t('link')}</a>
      </p>
      <button onClick={acceptCookies} className={styles.button}>
        {t('accept')}
      </button>
    </div>
  )
}
