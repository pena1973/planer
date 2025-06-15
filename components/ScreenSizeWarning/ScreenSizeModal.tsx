import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const ScreenSizeModal = () => {
  const { t } = useTranslation('ui')
  const [showModal, setShowModal] = useState(false)
  const [hiddenByUser, setHiddenByUser] = useState(false)

  useEffect(() => {
    const check = () => {
      const tooSmall = window.innerWidth < 1200
      const previouslyDismissed = localStorage.getItem('screenWarningDismissed') === 'true'
      setShowModal(tooSmall && !previouslyDismissed)
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleClose = () => {
    localStorage.setItem('screenWarningDismissed', 'true')
    setHiddenByUser(true)
  }

  if (!showModal || hiddenByUser) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '400px',
        textAlign: 'center',
        fontSize: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        animation: 'scaleIn 0.3s ease-in-out'
      }}>
        <p>⚠️ {t('screenTooSmall')}</p>
        <p style={{ marginBottom: '1em' }}>{t('screenHint')}</p>
        <button onClick={handleClose} style={{
          padding: '8px 16px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          {t('gotIt')}
        </button>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0 }
          to { transform: scale(1); opacity: 1 }
        }
      `}</style>
    </div>
  )
}
