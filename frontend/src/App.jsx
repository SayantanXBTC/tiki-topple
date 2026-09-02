import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import useGameStore from './store/gameStore'
import { useSocket } from './hooks/useSocket'
import { SocketContext } from './context/SocketContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import ErrorBoundary   from './components/ErrorBoundary'
import StartScreen     from './components/StartScreen'
import LoginScreen     from './components/LoginScreen'
import HomeScreen      from './components/HomeScreen'
import LobbyScreen     from './components/LobbyScreen'
import GameScreen      from './components/GameScreen'
import RoundEndScreen  from './components/RoundEndScreen'
import GameOverScreen  from './components/GameOverScreen'
import ProfileScreen   from './components/ProfileScreen'
import Notifications   from './components/Notifications'
import SoundToggleButton from './components/SoundToggleButton'

const SCREENS = {
  home:      HomeScreen,
  lobby:     LobbyScreen,
  game:      GameScreen,
  round_end: RoundEndScreen,
  game_over: GameOverScreen,
  profile:   ProfileScreen,
}

const PAGE_VARIANTS = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1,    transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, scale: 1.03, transition: { duration: 0.2,  ease: 'easeIn'  } },
}

// ── Inner app — needs AuthContext to already be provided ─────────────────────
function AppInner() {
  const socketActions = useSocket()
  const screen        = useGameStore(s => s.screen)
  const Screen        = SCREENS[screen] ?? HomeScreen

  const { user, authLoading } = useAuth()

  const [showStart, setShowStart] = useState(true)

  return (
    <SocketContext.Provider value={socketActions}>
      {/* Start screen (splash) */}
      <AnimatePresence>
        {showStart && (
          <motion.div
            key="start"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 100 }}
          >
            <StartScreen authLoading={authLoading} onEnter={() => setShowStart(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-splash: login gate → game screens */}
      {!showStart && (
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

      {/* Global sound toggle — jungle music on/off. Hidden on game screen
          (SettingsPanel there has the full audio controls). */}
      {!showStart && screen !== 'game' && (
        <SoundToggleButton style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 300,
        }} />
      )}

      {/* Global sonner toaster — royal amber theme, mounts once at root
          so lobby/game/round-end all share the same overlay stack. */}
      <Toaster
        position="top-right"
        theme="dark"
        richColors={false}
        toastOptions={{
          style: {
            background: 'linear-gradient(155deg, rgba(30,14,2,0.96) 0%, rgba(10,4,0,0.98) 100%)',
            border: '1.5px solid rgba(212,175,55,0.55)',
            color: '#f5ead0',
            fontFamily: '"Cinzel Decorative", "Georgia", serif',
            fontSize: 13,
            letterSpacing: '0.04em',
            boxShadow: '0 12px 34px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,225,140,0.18)',
          },
        }}
      />
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
