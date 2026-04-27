import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'

function NotificationItem({ n, onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3200)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <motion.div
      layout
      initial={{ x: 80, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 80, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        background: 'rgba(20, 7, 0, 0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(212,175,55,0.28)',
        borderRadius: 8,
        padding: '8px 13px',
        maxWidth: 220,
        boxShadow: '0 4px 18px rgba(0,0,0,0.55)',
        cursor: 'pointer',
      }}
      onClick={onDone}
    >
      <div style={{
        fontSize: 11.5,
        color: 'rgba(245,234,208,0.85)',
        fontFamily: '"Crimson Text", serif',
        lineHeight: 1.4,
      }}>
        {n.msg}
      </div>
      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: 3.2, ease: 'linear' }}
        style={{
          marginTop: 5,
          height: 2,
          background: 'rgba(212,175,55,0.5)',
          borderRadius: 1,
          transformOrigin: 'left',
        }}
      />
    </motion.div>
  )
}

export default function Notifications() {
  const { notifications, removeNotification } = useGameStore()

  return (
    <div style={{
      position: 'fixed',
      top: 56,
      right: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {notifications.map(n => (
          <div key={n.id} style={{ pointerEvents: 'auto' }}>
            <NotificationItem
              n={n}
              onDone={() => removeNotification(n.id)}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
