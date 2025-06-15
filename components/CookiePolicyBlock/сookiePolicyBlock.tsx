import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './сookiePolicyBlock.module.scss'

export const CookiePolicyBlock: React.FC = () => {
  const { t } = useTranslation('cookies')

  return (
    <div className={styles.container}>
      <h2>{t('title')}</h2>
      <p>{t('intro')}</p>

      <h3>{t('what_we_use')}</h3>
      <ul>
        <li>{t('refresh')}</li>
        <li>{t('session')}</li>
      </ul>

      <h3>{t('not_used')}</h3>
      <p>{t('not_used_text')}</p>

      <h3>{t('disable')}</h3>
      <p>{t('disable_text')}</p>

      <h3>{t('contact')}</h3>
      <p>{t('contact_text')}</p>
    </div>
  )
}
