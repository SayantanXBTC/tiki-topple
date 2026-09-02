import { useMemo, useCallback, useState, memo, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import useGameStore from '../store/gameStore'
import { useSocketContext } from '../context/SocketContext'
import { useSoundEngine } from '../hooks/useSoundEngine'
import { AVATAR_MAP } from '../data/avatars'
import TikiBoard2D from './TikiBoard2D'
import OpponentArea from './OpponentArea'
import PlayerHand from './PlayerHand'
import SecretTikiCard from './SecretTikiCard'
import RulesModal from './RulesModal'
import TorchEmbers from './TorchEmbers'
import ChronicleRail from './ChronicleRail'

// Route-split the r3f island scene to cut initial bundle (~700KB saved)
const IslandJungleScene = lazy(() => import('./IslandJungleScene'))

// Reduced-motion fallback: static gradient bg + palm silhouettes
function ReducedMotionBackdrop() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'linear-gradient(180deg, #030818 0%, #0a1a3c 45%, #123a5c 75%, #1a4d5c 100%)',
    }} />
  )
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = e => setReduced(e.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])
  return reduced
}

// ── Valid target computation ──────────────────────────────────────────────────
function getValidTargets(card, board) {
  if (!card || !board) return []
  switch (card.type) {
    case 'up1':    return board.filter(t => t.position > 1).map(t => t.id)
    case 'up2':    return board.filter(t => t.position > 2).map(t => t.id)
    case 'up3':    return board.filter(t => t.position > 3).map(t => t.id)
    case 'topple': return board.filter(t => t.position < board.length).map(t => t.id)
    case 'toast':  return []
    default:       return []
  }
}

// ── Opponent positioning ──────────────────────────────────────────────────────
function computeOpponents(players, myPlayerId) {
  if (!players || !myPlayerId) return []
  const n     = players.length
  const myIdx = players.findIndex(p => p.id === myPlayerId)
  if (myIdx === -1) return []
  // All opponent cards sit on the left / right rails (never on top) so they
  // never overlap with the top score-stone arc or the header.
  const slotsByCount = {
    2: ['right'],
    3: ['left', 'right'],
    // 4p: one centered on left, two stacked on right — never overlap because
    // right pair is compact and left is centered.
    4: ['left', 'right-top', 'right-bottom'],
  }
  const slots = slotsByCount[n] || []
  return slots.map((position, i) => ({
    player:   players[(myIdx + 1 + i) % n],
    position,
  }))
}

// ── Compact turn chip — lives in the header ───────────────────────────────────
function TurnChip({ isMyTurn, selectedCard, currentPlayerName, currentPlayerColor }) {
  const hasCard = !!selectedCard

  if (isMyTurn) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="my-chip"
          initial={{ opacity: 0, scale: 0.85, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 6 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgba(212,175,55,0)', '0 0 16px rgba(212,175,55,0.6)', '0 0 0px rgba(212,175,55,0)'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 100%)',
              border: '1px solid rgba(212,175,55,0.55)',
              borderRadius: 20, padding: '4px 14px',
            }}
          >
            <motion.span
              animate={{ textShadow: ['0 0 6px rgba(212,175,55,0.4)', '0 0 16px rgba(212,175,55,0.95)', '0 0 6px rgba(212,175,55,0.4)'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                color: '#d4af37', fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 10, fontWeight: 900, letterSpacing: '0.12em',
              }}
            >
              YOUR TURN
            </motion.span>
            <div style={{ width: 1, height: 10, background: 'rgba(212,175,55,0.3)' }} />
            <span style={{
              color: hasCard ? 'rgba(212,175,55,0.8)' : 'rgba(245,234,208,0.55)',
              fontSize: 9, fontFamily: '"Cinzel Decorative", cursive', letterSpacing: '0.06em',
              transition: 'color 0.25s',
            }}>
              {hasCard
                ? (selectedCard.type !== 'toast' ? 'PICK TIKI' : 'TOAST PLAYED')
                : 'PICK CARD'}
            </span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="wait-chip"
        initial={{ opacity: 0, scale: 0.85, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 6 }}
        transition={{ duration: 0.2 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(8,3,0,0.7)',
          border: `1px solid ${currentPlayerColor || '#888'}30`,
          borderRadius: 20, padding: '4px 12px',
        }}
      >
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: currentPlayerColor || '#888',
          boxShadow: `0 0 6px ${currentPlayerColor || '#888'}`,
          flexShrink: 0,
        }} />
        <span style={{
          color: 'rgba(245,234,208,0.58)', fontSize: 9.5,
          fontFamily: '"Cinzel Decorative", cursive',
          maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}>
          {currentPlayerName}
        </span>
        {[0, 0.2, 0.4].map((d, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: d }}
            style={{ width: 4, height: 4, borderRadius: '50%', background: currentPlayerColor || '#888', flexShrink: 0 }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Connection dot ────────────────────────────────────────────────────────────
function ConnectionDot({ status }) {
  const COLOR = {
    connected:    '#4ade80',
    reconnecting: '#fbbf24',
    failed:       '#f87171',
    disconnected: '#f87171',
  }
  const color = COLOR[status] || '#6b7280'
  return (
    <motion.div
      title={`Connection: ${status}`}
      animate={status === 'reconnecting'
        ? { opacity: [1, 0.25, 1], scale: [1, 1.3, 1] }
        : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.85, repeat: status === 'reconnecting' ? Infinity : 0 }}
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}cc`,
        flexShrink: 0,
      }}
      aria-label={`Connection: ${status}`}
      role="status"
    />
  )
}

// ── Score pill ────────────────────────────────────────────────────────────────
function ScorePill({ player, isMe }) {
  const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: isMe
        ? 'linear-gradient(135deg, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.06) 100%)'
        : 'linear-gradient(135deg, rgba(18,8,2,0.85), rgba(6,2,0,0.9))',
      borderRadius: 999,
      padding: '4px 14px 4px 5px',
      border: '1.5px solid transparent',
      backgroundImage: isMe
        ? `linear-gradient(135deg, rgba(212,175,55,0.22), rgba(212,175,55,0.06)),
           linear-gradient(135deg, #7a5810 0%, #d4af37 22%, #fbe58a 46%, #d4af37 62%, #7a5810 88%, #fbe58a 100%)`
        : `linear-gradient(135deg, rgba(18,8,2,0.85), rgba(6,2,0,0.9)),
           linear-gradient(135deg, ${player.color}77, ${player.color}22, ${player.color}77)`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      boxShadow: isMe
        ? '0 0 18px rgba(212,175,55,0.2), inset 0 1px 0 rgba(255,225,140,0.25)'
        : '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
      transition: 'background-image 0.3s',
    }}>
      {/* Avatar thumbnail */}
      <div style={{
        width: 27, height: 27, borderRadius: '50%', overflow: 'hidden',
        border: `1.5px solid ${isMe ? '#d4af37' : player.color}`,
        background: 'radial-gradient(ellipse at 50% 30%, rgba(55,22,0,0.9), rgba(10,3,0,0.95))',
        flexShrink: 0,
      }}>
        {avatar
          ? <div dangerouslySetInnerHTML={{ __html: avatar.svg }} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
          : <div style={{
              width: '100%', height: '100%',
              background: `radial-gradient(ellipse at 50% 30%, ${player.color}cc, ${player.color})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'white', fontSize: 10, fontFamily: '"Cinzel Decorative", cursive', fontWeight: 700 }}>
                {player.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
        }
      </div>

      <span style={{
        fontSize: 12,
        fontFamily: '"Cinzel Decorative", cursive',
        color: isMe ? '#d4af37' : 'rgba(245,234,208,0.78)',
        fontWeight: isMe ? 700 : 400,
        maxWidth: 60,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}>
        {player.name}
      </span>

      <span style={{
        fontSize: 17, fontWeight: 900,
        fontFamily: '"Cinzel Decorative", cursive',
        minWidth: 22, textAlign: 'right',
        letterSpacing: '-0.01em',
        background: 'linear-gradient(180deg, #fbe58a 0%, #d4af37 55%, #7a5810 100%)',
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
      }}>
        {player.score}
      </span>
    </div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────
const SettingsPanel = memo(function SettingsPanel({ onClose }) {
  const settings       = useGameStore(s => s.settings)
  const updateSettings = useGameStore(s => s.updateSettings)
  const sound          = useSoundEngine()

  const handleVolume = (v) => {
    updateSettings({ masterVolume: v })
    sound.setMasterVolume?.(v)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.68)', backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <motion.div
        initial={{ scale: 0.84, opacity: 0, y: 22 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 270, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 340,
          background: 'linear-gradient(168deg, #2c1200 0%, #1a0800 55%, #0e0500 100%)',
          border: '1.5px solid rgba(212,175,55,0.32)',
          borderRadius: 18,
          padding: '22px 24px 20px',
          boxShadow: '0 0 44px rgba(212,175,55,0.1), 0 22px 64px rgba(0,0,0,0.75)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 16, fontWeight: 700, color: '#d4af37',
            letterSpacing: '0.05em',
          }}>
            Settings
          </div>
          <motion.button
            whileHover={{ scale: 1.12, rotate: 90 }} whileTap={{ scale: 0.9 }}
            onClick={onClose} aria-label="Close settings"
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 9, color: 'rgba(245,234,208,0.65)',
              width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 14,
            }}
          >✕</motion.button>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.35), transparent)', marginBottom: 20 }} />

        {/* Volume slider */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <label htmlFor="vol-slider" style={{
              fontSize: 10, color: 'rgba(245,234,208,0.6)',
              fontFamily: '"Cinzel Decorative", cursive', letterSpacing: '0.1em',
            }}>
              MASTER VOLUME
            </label>
            <span style={{
              fontSize: 11, color: '#d4af37',
              fontFamily: '"Cinzel Decorative", cursive',
            }}>
              {Math.round(settings.masterVolume * 100)}%
            </span>
          </div>
          <input
            id="vol-slider" type="range" min={0} max={1} step={0.05}
            value={settings.masterVolume}
            onChange={e => handleVolume(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: '#d4af37' }}
            aria-label="Master volume"
          />
        </div>

        {/* Toggles */}
        {[
          { key: 'musicEnabled',     label: 'Ambient Music'    },
          { key: 'effectsEnabled',   label: 'Sound Effects'    },
          { key: 'particlesEnabled', label: 'Particle Effects' },
        ].map(({ key, label }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 14,
          }}>
            <span style={{
              fontSize: 13.5, color: 'rgba(245,234,208,0.62)',
              fontFamily: '"Crimson Text", serif',
            }}>
              {label}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => updateSettings({ [key]: !settings[key] })}
              aria-label={`${label}: ${settings[key] ? 'on' : 'off'}`}
              aria-pressed={settings[key]}
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: settings[key]
                  ? 'linear-gradient(90deg, #d4af37, #b8940e)'
                  : 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', position: 'relative',
                transition: 'background 0.28s',
              }}
            >
              <motion.div
                animate={{ x: settings[key] ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                style={{
                  position: 'absolute', top: 2, width: 20, height: 20,
                  borderRadius: '50%', background: 'white',
                  boxShadow: '0 1px 5px rgba(0,0,0,0.45)',
                }}
              />
            </motion.button>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
})

// ── GameScreen ────────────────────────────────────────────────────────────────
export default function GameScreen() {
  const {
    board, myHand, mySecretCard, players,
    isMyTurn, selectedCard, roundNumber, totalRounds,
    currentTurnPlayerId, myPlayerId, errorMessage, connectionStatus,
    selectCard, clearSelection, clearError,
  } = useGameStore()

  const { playCard }   = useSocketContext()
  const sound          = useSoundEngine()
  const [showRules,    setShowRules]    = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [shake,        setShake]        = useState(false)
  const reducedMotion  = usePrefersReducedMotion()

  // ARIA live announcement — narrates state changes for screen readers
  const currentPlayerNameForLive = players.find(p => p.id === currentTurnPlayerId)?.name || ''
  const liveMessage = isMyTurn
    ? `Your turn. ${selectedCard ? `Card ${selectedCard.type} selected. Choose a tiki.` : 'Pick a card.'}`
    : `${currentPlayerNameForLive} is playing. Round ${roundNumber} of ${totalRounds}.`

  // Toast notifications for meaningful events
  const prevRound = useRef(roundNumber)
  const prevTurnId = useRef(currentTurnPlayerId)
  useEffect(() => {
    if (roundNumber !== prevRound.current) {
      toast(`Round ${roundNumber} of ${totalRounds}`, {
        description: 'The tikis stir…',
        duration: 2600,
      })
      prevRound.current = roundNumber
    }
  }, [roundNumber, totalRounds])
  useEffect(() => {
    if (prevTurnId.current && prevTurnId.current !== currentTurnPlayerId) {
      if (isMyTurn) {
        // Delay 2.6s so the opponent's card_played narration toast is fully
        // read before "Your turn" appears. Cancels if turn changes again.
        const id = setTimeout(() => toast.success('Your turn', { duration: 2000 }), 2600)
        prevTurnId.current = currentTurnPlayerId
        return () => clearTimeout(id)
      }
    }
    prevTurnId.current = currentTurnPlayerId
  }, [currentTurnPlayerId, isMyTurn])
  useEffect(() => {
    if (errorMessage) toast.error(errorMessage, { duration: 2400 })
  }, [errorMessage])

  // Start/stop background ambience based on settings — respects the
  // Ambient Music toggle in the settings panel + master volume slider.
  const musicEnabled = useGameStore(s => s.settings.musicEnabled)
  const masterVolume = useGameStore(s => s.settings.masterVolume)
  useEffect(() => {
    if (musicEnabled) sound.startAmbient()
    else sound.stopAmbient()
    return () => sound.stopAmbient()
  }, [sound, musicEnabled])
  useEffect(() => {
    sound.setMasterVolume?.(masterVolume)
  }, [sound, masterVolume])

  const opponents    = useMemo(() => computeOpponents(players, myPlayerId), [players, myPlayerId])
  const validTikiIds = useMemo(() => getValidTargets(selectedCard, board), [selectedCard, board])

  const currentPlayer      = players.find(p => p.id === currentTurnPlayerId)
  const currentPlayerName  = currentPlayer?.name  || '...'
  const currentPlayerColor = currentPlayer?.color || '#888'

  const handleCardSelect = useCallback((card) => {
    if (!isMyTurn) return
    if (card.type === 'toast') {
      sound.play('tiki_toast')
      clearSelection()
      setShake(true)
      setTimeout(() => setShake(false), 500)
      playCard('toast', null)
    } else {
      sound.play('tiki_move')
      selectCard(card)
    }
  }, [isMyTurn, playCard, selectCard, clearSelection, sound])

  const handleTikiClick = useCallback((tikId) => {
    if (!selectedCard) return
    if (selectedCard.type === 'topple') {
      sound.play('tiki_topple')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } else if (selectedCard.type.startsWith('up')) {
      sound.play('tiki_push')
    } else {
      sound.play('tiki_move')
    }
    playCard(selectedCard.type, tikId)
    clearSelection()
  }, [selectedCard, playCard, clearSelection, sound])

  function opponentStyle(position) {
    if (position === 'right')        return { top: '50%', right: 12, transform: 'translateY(-50%)' }
    if (position === 'left')         return { top: '50%', left: 12,  transform: 'translateY(-50%)' }
    if (position === 'left-top')     return { top: 120,   left: 12 }
    if (position === 'left-bottom')  return { bottom: 300,left: 12 }
    if (position === 'right-top')    return { top: 120,   right: 12 }
    if (position === 'right-bottom') return { bottom: 300,right: 12 }
    return {}
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      userSelect: 'none', WebkitUserSelect: 'none',
      touchAction: 'none', overflow: 'hidden',
      // Solid dark base so any semi-transparent overlays never reveal a
      // white default-canvas flash above/around the scene.
      background: '#02040a',
    }}>
      {reducedMotion
        ? <ReducedMotionBackdrop />
        : (
          <Suspense fallback={<ReducedMotionBackdrop />}>
            <IslandJungleScene />
          </Suspense>
        )
      }
      <TorchEmbers />

      {/* Campfire glow overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(circle at 50% 120%, rgba(255,100,20,0.15) 0%, transparent 60%)',
      }} />

      {/* ── Header — 2 rows: scores+round+btns / turn chip ──────────────── */}
      <div style={{
        flexShrink: 0, zIndex: 30, position: 'relative',
        // Fully opaque so the r3f canvas behind can never bleed a pale
        // rectangle through translucent header regions.
        background: 'linear-gradient(180deg, #060300 0%, #0a0501 100%)',
        borderBottom: '1.5px solid rgba(212,175,55,0.38)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      }}>
        {/* Row 1: scores + round + buttons */}
        <div style={{
          height: 'clamp(50px, 5.8vh, 60px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 14px',
        }}>
          {/* Left: connection + score pills */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden', flex: 1 }}>
            <ConnectionDot status={connectionStatus} />
            {players.map(p => (
              <ScorePill key={p.id} player={p} isMe={p.id === myPlayerId} />
            ))}
          </div>

          {/* Center: Round counter */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, padding: '0 12px' }}>
            <span style={{
              fontFamily: '"Cinzel Decorative", cursive',
              fontSize: 'clamp(7px, 0.85vw, 10px)',
              color: 'rgba(212,175,55,0.5)', letterSpacing: '0.18em', lineHeight: 1,
            }}>ROUND</span>
            <span style={{
              fontFamily: '"Cinzel Decorative", cursive',
              fontSize: 'clamp(12px, 1.3vw, 16px)',
              fontWeight: 900, letterSpacing: '0.04em',
              lineHeight: 1.1, whiteSpace: 'nowrap',
              background: 'linear-gradient(180deg, #fbe58a 0%, #d4af37 55%, #7a5810 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(212,175,55,0.5))',
            }}>
              {roundNumber} <span style={{ opacity: 0.4, fontWeight: 400, fontSize: '0.7em' }}>/ {totalRounds}</span>
            </span>
          </div>

          {/* Right: action buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <motion.button
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowRules(true)} aria-label="View game rules"
              style={{
                background: 'radial-gradient(circle at 30% 25%, #fbe58a 0%, #d4af37 40%, #7a5810 100%)',
                border: '1.5px solid #4a3208',
                borderRadius: '50%', width: 36, height: 36,
                color: '#1a0a00', fontSize: 15,
                fontFamily: '"Cinzel Decorative", cursive', fontWeight: 900,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.3)',
                textShadow: '0 1px 0 rgba(255,225,140,0.5)',
              }}
            >?</motion.button>
            <motion.button
              whileHover={{ scale: 1.12, rotate: 30 }} whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)} aria-label="Open settings"
              style={{
                background: 'radial-gradient(circle at 30% 25%, #d4af37 0%, #8a6614 45%, #4a3208 100%)',
                border: '1.5px solid #2a1c04',
                borderRadius: '50%', width: 36, height: 36,
                color: '#1a0a00', fontSize: 15,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,225,140,0.35), inset 0 -2px 4px rgba(0,0,0,0.35)',
              }}
            >⚙</motion.button>
          </div>
        </div>

        {/* Row 2: compact turn chip — fully opaque so the r3f canvas
            behind the header never bleeds through as a pale rectangle. */}
        <div style={{
          height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: '1px solid rgba(212,175,55,0.12)',
          background: '#080401',
        }}>
          <TurnChip
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            currentPlayerName={currentPlayerName}
            currentPlayerColor={currentPlayerColor}
          />
        </div>
      </div>

      {/* ── Game area ───────────────────────────────────────────────────── */}
      <motion.div 
        animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0], y: [-4, 4, -3, 3, 0] } : { x: 0, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 2 }}
      >
        {/* 3D Board — full screen, cards/secret tiki overlay on top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 4 }}>
          <TikiBoard2D
            board={board}
            players={players}
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            onTikiClick={handleTikiClick}
            validTikiIds={validTikiIds}
            roundNumber={roundNumber}
          />
        </div>

        {/* Chronicle rail disabled — opponents now live on both left+right rails
            so right side is no longer empty. Sonner narration + header round
            counter cover the same intent. */}

        {/* Opponent pods — grouped into left/right rails w/ flex column so
            multiple cards on the same rail can never overlap regardless of
            viewport height. Rail centers vertically; cards space out evenly. */}
        {(() => {
          const leftPods  = opponents.filter(o => o.position.startsWith('left'))
          const rightPods = opponents.filter(o => o.position.startsWith('right'))
          const Rail = ({ side, pods }) => pods.length ? (
            <div style={{
              position: 'absolute',
              [side]: 12,
              top: 120,
              bottom: 280,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: pods.length === 1 ? 'center' : 'space-between',
              gap: 12,
              zIndex: 10,
              pointerEvents: 'none',
            }}>
              {pods.map(({ player, position }) => (
                <div key={player.id} style={{ pointerEvents: 'auto' }}>
                  <OpponentArea
                    player={player}
                    position={position}
                    cardCount={player.cardsRemaining ?? 0}
                  />
                </div>
              ))}
            </div>
          ) : null
          return <><Rail side="left" pods={leftPods} /><Rail side="right" pods={rightPods} /></>
        })()}


        {/* Connection lost overlay */}
        <AnimatePresence>
          {connectionStatus === 'failed' && (
            <motion.div
              key="conn-lost"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 20, zIndex: 100,
              }}
            >
              <div style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 22, color: '#d4af37', textAlign: 'center',
                textShadow: '0 0 20px rgba(212,175,55,0.4)',
              }}>
                Connection Lost
              </div>
              <div style={{
                fontSize: 15, color: 'rgba(245,234,208,0.55)',
                fontFamily: '"Crimson Text", serif',
                fontStyle: 'italic', textAlign: 'center',
              }}>
                Unable to reconnect after 5 attempts.
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(180deg, #6b3a1f 0%, #3d1f0a 50%, #2a1000 100%)',
                  border: '1.5px solid rgba(212,175,55,0.5)',
                  borderRadius: 8,
                  color: '#f5ead0', padding: '14px 38px',
                  fontSize: 13,
                  fontFamily: '"Cinzel Decorative", cursive',
                  fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
                  boxShadow: '0 5px 0 #1a0800, 0 8px 22px rgba(0,0,0,0.6)',
                }}
              >
                Rejoin Game
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error toast */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              key="error"
              initial={{ y: 26, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 26, opacity: 0 }}
              onAnimationComplete={() => setTimeout(clearError, 2200)}
              role="alert"
              style={{
                position: 'absolute', bottom: 22, left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(145deg, rgba(130,12,12,0.95) 0%, rgba(100,8,8,0.97) 100%)',
                backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(200,60,50,0.55)',
                borderRadius: 10, padding: '10px 24px',
                fontSize: 14, color: '#ffc0c0',
                fontFamily: '"Crimson Text", serif',
                fontStyle: 'italic',
                zIndex: 35, maxWidth: 320, textAlign: 'center',
                boxShadow: '0 6px 20px rgba(0,0,0,0.65)',
              }}
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Header turn chip already conveys action ("YOUR TURN | PICK CARD");
          the standalone footer bar was removed to prevent overlap with the
          long totem board that extends nearly to the card tray. */}

      {/* ── Bottom tray — fixed at viewport bottom ──────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 240,
        zIndex: 20,
        pointerEvents: 'none',
        overflow: 'visible',
      }}>
        {/* Dark gradient base */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(0deg, rgba(6,1,0,0.92) 0%, rgba(6,1,0,0.55) 55%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Secret tiki card — bottom-left */}
        <div style={{ position: 'absolute', left: 12, bottom: 10, pointerEvents: 'auto', zIndex: 5 }}>
          <SecretTikiCard secretCard={mySecretCard} />
        </div>

        {/* Player hand — centered */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto', zIndex: 10 }}>
          <PlayerHand
            hand={myHand}
            selectedCard={selectedCard}
            onCardSelect={handleCardSelect}
            isMyTurn={isMyTurn}
          />
        </div>
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      {/* Screen-reader live region — narrates state changes */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
          overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
        }}
      >
        {liveMessage}
      </div>

      {/* Toaster is mounted globally in App.jsx — no duplicate here */}
    </div>
  )
}
