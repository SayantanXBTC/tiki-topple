import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from './store/gameStore'
import { useSocket } from './hooks/useSocket'
import { SocketContext } from './context/SocketContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary   from './components/ErrorBoundary'
import LoadingScreen   from './components/LoadingScreen'
import StartScreen     from './components/StartScreen'
import LoginScreen     from './components/LoginScreen'
import HomeScreen      from './components/HomeScreen'
import LobbyScreen     from './components/LobbyScreen'
import GameScreen      from './components/GameScreen'
import RoundEndScreen  from './components/RoundEndScreen'
import GameOverScreen  from './components/GameOverScreen'
import Notifications   from './components/Notifications'

const SCREENS = {
  home:      HomeScreen,
  lobby:     LobbyScreen,
  game:      GameScreen,
  round_end: RoundEndScreen,
  game_over: GameOverScreen,
}

const PAGE_VARIANTS = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1,    transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 1.03, transition: { duration: 0.2,  ease: 'easeIn'  } },
}

const MIN_LOADING_MS = 1500

// ── Inner app — needs AuthContext to already be provided ─────────────────────
function AppInner() {
  const socketActions = useSocket()
  const screen        = useGameStore(s => s.screen)
  const Screen        = SCREENS[screen] ?? HomeScreen

  const { user, authLoading } = useAuth()

  const [loading,   setLoading]   = useState(true)
  const [showStart, setShowStart] = useState(true)

  // Enforce minimum loading screen time AND wait for firebase auth to settle
  useEffect(() => {
    let done = false
    const timer = setTimeout(() => {
      done = true
      if (!authLoading) setLoading(false)
    }, MIN_LOADING_MS)

    return () => clearTimeout(timer)
  }, [])

  // Once authLoading resolves after the minimum time has passed, hide loader
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => setLoading(false), MIN_LOADING_MS)
      return () => clearTimeout(timer)
    }
  }, [authLoading])

  return (
    <SocketContext.Provider value={socketActions}>
      {/* Loading screen */}
      <AnimatePresence>
        {(loading || authLoading) && <LoadingScreen key="loading" />}
      </AnimatePresence>

      {/* Start screen (splash) */}
      <AnimatePresence>
        {!loading && !authLoading && showStart && (
          <motion.div
            key="start"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          >
            <StartScreen onEnter={() => setShowStart(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-splash: login gate → game screens */}
      {!loading && !authLoading && !showStart && (
        <AnimatePresence mode="wait">
          {!user ? (
            /* ── Not authenticated → show login ── */
            <motion.div
              key="login"
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ position: 'fixed', inset: 0 }}
            >
              <LoginScreen />
            </motion.div>
          ) : (
            /* ── Authenticated → game flow ── */
            <motion.div
              key={screen}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ position: 'fixed', inset: 0 }}
            >
              <Screen />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Notifications — above all screens */}
      <Notifications />
    </SocketContext.Provider>
  )
}

// ── Root export — wraps everything in AuthProvider ────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  )
}
