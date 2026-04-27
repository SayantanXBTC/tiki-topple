import { useMemo, useCallback, useState, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useSocketContext } from '../context/SocketContext'
import { useSoundEngine } from '../hooks/useSoundEngine'
import { AVATAR_MAP } from '../data/avatars'
import TikiBoard from '../three/TikiBoard'
import OpponentArea from './OpponentArea'
import PlayerHand from './PlayerHand'
import SecretTikiCard from './SecretTikiCard'
import TurnIndicator from './TurnIndicator'
import RulesModal from './RulesModal'
import VolcanicAtmosphere from './VolcanicAtmosphere'

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
  const slotsByCount = {
    2: ['right'],
    3: ['top-left', 'top-right'],
    4: ['top-left', 'top-center', 'top-right'],
  }
  const slots = slotsByCount[n] || []
  return slots.map((position, i) => ({
    player:   players[(myIdx + 1 + i) % n],
    position,
  }))
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
      display: 'flex', alignItems: 'center', gap: 7,
      background: isMe
        ? 'linear-gradient(135deg, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0.08) 100%)'
        : 'rgba(8,3,0,0.60)',
      borderRadius: 999,
      padding: '4px 13px 4px 5px',
      border: isMe
        ? '1.5px solid rgba(212,175,55,0.52)'
        : `1px solid ${player.color}44`,
      boxShadow: isMe ? '0 0 14px rgba(212,175,55,0.12)' : 'none',
      transition: 'border-color 0.3s',
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
        color: '#d4af37',
        fontFamily: '"Cinzel Decorative", cursive',
        minWidth: 22, textAlign: 'right',
        letterSpacing: '-0.01em',
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

  const opponents    = useMemo(() => computeOpponents(players, myPlayerId), [players, myPlayerId])
  const validTikiIds = useMemo(() => getValidTargets(selectedCard, board), [selectedCard, board])

  const currentPlayer      = players.find(p => p.id === currentTurnPlayerId)
  const currentPlayerName  = currentPlayer?.name  || '...'
  const currentPlayerColor = currentPlayer?.color || '#888'

  const handleCardSelect = useCallback((card) => {
    if (!isMyTurn) return
    if (card.type === 'toast') {
      sound.play('tiki_move')
      clearSelection()
      playCard('toast', null)
    } else {
      sound.play('tiki_move')
      selectCard(card)
    }
  }, [isMyTurn, playCard, selectCard, clearSelection, sound])

  const handleTikiClick = useCallback((tikId) => {
    if (!selectedCard) return
    sound.play('tiki_move')
    playCard(selectedCard.type, tikId)
    clearSelection()
  }, [selectedCard, playCard, clearSelection, sound])

  function opponentStyle(position) {
    if (position === 'right')      return { top: '50%', right: 12, transform: 'translateY(-50%)' }
    if (position === 'top-left')   return { top: 14, left: 12 }
    if (position === 'top-center') return { top: 14, left: '50%', transform: 'translateX(-50%)' }
    if (position === 'top-right')  return { top: 14, right: 12 }
    return {}
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      userSelect: 'none', WebkitUserSelect: 'none',
      touchAction: 'none', overflow: 'hidden',
    }}>
      <VolcanicAtmosphere />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 'clamp(50px, 5.8vh, 62px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px',
        background: 'linear-gradient(180deg, rgba(8,3,0,0.96) 0%, rgba(6,2,0,0.92) 100%)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(212,175,55,0.18)',
        flexShrink: 0, zIndex: 30, position: 'relative',
      }}>
        {/* Left: connection + score pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden', flex: 1 }}>
          <ConnectionDot status={connectionStatus} />
          {players.map(p => (
            <ScorePill key={p.id} player={p} isMe={p.id === myPlayerId} />
          ))}
        </div>

        {/* Center: Round counter */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          flexShrink: 0, padding: '0 12px',
        }}>
          <span style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 'clamp(8px, 0.9vw, 11px)',
            color: 'rgba(212,175,55,0.55)',
            letterSpacing: '0.18em',
            lineHeight: 1,
          }}>
            ROUND
          </span>
          <span style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 'clamp(13px, 1.4vw, 17px)',
            color: '#d4af37',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textShadow: '0 0 12px rgba(212,175,55,0.4)',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
          }}>
            {roundNumber} <span style={{ opacity: 0.4, fontWeight: 400, fontSize: '0.7em' }}>/ {totalRounds}</span>
          </span>
        </div>
      </div>

      {/* ── Game area ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* 3D Board */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
          <TikiBoard
            board={board}
            players={players}
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            onTikiClick={handleTikiClick}
            validTikiIds={validTikiIds}
            roundNumber={roundNumber}
          />
        </div>

        {/* Opponent pods */}
        {opponents.map(({ player, position }) => (
          <div
            key={player.id}
            style={{ position: 'absolute', zIndex: 10, ...opponentStyle(position) }}
          >
            <OpponentArea
              player={player}
              position={position}
              cardCount={player.cardsRemaining ?? 0}
            />
          </div>
        ))}

        {/* Turn indicator */}
        <div style={{
          position: 'absolute', bottom: 14, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
          zIndex: 15, pointerEvents: 'none',
        }}>
          <TurnIndicator
            isMyTurn={isMyTurn}
            selectedCard={selectedCard}
            currentPlayerName={currentPlayerName}
            currentPlayerColor={currentPlayerColor}
          />
        </div>

        {/* FAB buttons — right side, properly stacked */}
        <div style={{
          position: 'absolute', right: 14, bottom: 14,
          display: 'flex', flexDirection: 'column', gap: 8,
          zIndex: 20,
        }}>
          {/* Rules button */}
          <motion.button
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
            onClick={() => setShowRules(true)} aria-label="View game rules"
            style={{
              background: 'linear-gradient(145deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.08) 100%)',
              border: '1.5px solid rgba(212,175,55,0.48)',
              borderRadius: '50%', width: 40, height: 40,
              color: '#d4af37', fontSize: 17,
              fontFamily: '"Cinzel Decorative", cursive', fontWeight: 900,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
          >?</motion.button>

          {/* Settings button */}
          <motion.button
            whileHover={{ scale: 1.12, rotate: 30 }} whileTap={{ scale: 0.9 }}
            onClick={() => setShowSettings(true)} aria-label="Open settings"
            style={{
              background: 'linear-gradient(145deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1.5px solid rgba(212,175,55,0.32)',
              borderRadius: '50%', width: 40, height: 40,
              color: 'rgba(212,175,55,0.7)', fontSize: 17,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.55)',
              backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            }}
          >⚙</motion.button>
        </div>

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
      </div>

      {/* ── Bottom tray — secret card + hand ────────────────────────────── */}
      <div style={{
        height: 'clamp(170px, 19vh, 210px)',
        position: 'relative',
        flexShrink: 0,
        zIndex: 20,
        background: 'linear-gradient(0deg, rgba(5,1,0,0.99) 0%, rgba(7,2,0,0.88) 45%, rgba(10,3,0,0.55) 75%, transparent 100%)',
        borderTop: '1px solid rgba(212,175,55,0.11)',
      }}>
        {/* Secret tiki card — bottom-left */}
        <div style={{ position: 'absolute', left: 12, bottom: 12 }}>
          <SecretTikiCard secretCard={mySecretCard} />
        </div>

        {/* Player hand — centered */}
        <PlayerHand
          hand={myHand}
          selectedCard={selectedCard}
          onCardSelect={handleCardSelect}
          isMyTurn={isMyTurn}
        />
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>
    </div>
  )
}
