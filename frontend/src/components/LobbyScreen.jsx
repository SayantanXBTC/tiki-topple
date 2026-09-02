import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useSocketContext } from '../context/SocketContext'
import { AVATAR_MAP } from '../data/avatars'
import TorchEmbers from './TorchEmbers'

// Shared jungle scene — same r3f Canvas used by GameScreen (real torch flames,
// palms, ocean, moon, mist) so lobby matches game screen aesthetically.
const IslandJungleScene = lazy(() => import('./IslandJungleScene'))

function LobbyBackdropFallback() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
      background: 'linear-gradient(180deg, #030818 0%, #0a1a3c 45%, #123a5c 75%, #1a4d5c 100%)',
    }} />
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function CornerOrnament({ pos }) {
  const isRight = pos.includes('right')
  const isBottom = pos.includes('bottom')
  return (
    <svg
      width="22" height="22" viewBox="0 0 22 22" fill="none"
      style={{
        position: 'absolute',
        [isBottom ? 'bottom' : 'top']: -1,
        [isRight ? 'right' : 'left']: -1,
        pointerEvents: 'none', zIndex: 2,
        transform: `scale(${isRight ? -1 : 1}, ${isBottom ? -1 : 1})`,
        transformOrigin: 'center',
      }}
    >
      <path d="M 1,21 L 1,5 Q 1,1 5,1 L 21,1" stroke="rgba(212,175,55,0.52)" strokeWidth="1.3" fill="none"/>
      <circle cx="5" cy="5" r="1.8" fill="rgba(212,175,55,0.30)"/>
    </svg>
  )
}

function WoodPanel({ children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #2d1608 0%, #1e0e04 55%, #140a02 100%)',
      border: '1.5px solid rgba(212,175,55,0.42)',
      borderRadius: 14,
      boxShadow: '0 16px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.06)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <CornerOrnament pos="top-left" />
      <CornerOrnament pos="top-right" />
      <CornerOrnament pos="bottom-left" />
      <CornerOrnament pos="bottom-right" />
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.65), transparent)',
      }} />
      {[20, 45, 68, 88].map((pct, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: 1,
          background: 'rgba(0,0,0,0.18)', opacity: 0.5,
        }} />
      ))}
      {children}
    </div>
  )
}

function AvatarCircle({ player, size = 44 }) {
  const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${player.color}`,
      boxShadow: `0 0 10px ${player.color}66`,
      background: `radial-gradient(circle at 40% 30%, ${player.color}55, rgba(10,4,0,0.9))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {avatar
        ? <div dangerouslySetInnerHTML={{ __html: avatar.svg }} style={{ width: '82%', height: '82%' }} />
        : <span style={{ color: 'white', fontSize: size * 0.38, fontFamily: '"Cinzel Decorative",cursive', fontWeight: 700 }}>
            {player.name[0]?.toUpperCase()}
          </span>
      }
    </div>
  )
}

const EMPTY_SLOT_PHRASES = [
  'Summoning warrior…',
  'The spirits await…',
  'Awaiting champion…',
  'The island calls…',
]

function TikiMaskIcon() {
  return (
    <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
      <ellipse cx="12" cy="14" rx="9" ry="11" fill="rgba(212,175,55,0.10)" stroke="rgba(212,175,55,0.28)" strokeWidth="0.9"/>
      <path d="M 5,11 Q 12,9 19,11" stroke="rgba(212,175,55,0.26)" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <ellipse cx="8.5" cy="14" rx="2.2" ry="2.6" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.32)" strokeWidth="0.8"/>
      <ellipse cx="15.5" cy="14" rx="2.2" ry="2.6" fill="rgba(212,175,55,0.15)" stroke="rgba(212,175,55,0.32)" strokeWidth="0.8"/>
      <path d="M 10.5,18.5 Q 12,17.2 13.5,18.5 Q 12,20 10.5,18.5 Z" fill="rgba(212,175,55,0.18)"/>
      <path d="M 7.5,22.5 Q 12,25.5 16.5,22.5" stroke="rgba(212,175,55,0.26)" strokeWidth="0.9" fill="none" strokeLinecap="round"/>
      <path d="M 5,5.5 L 7,2.5 L 9,5.5 L 12,1.5 L 15,5.5 L 17,2.5 L 19,5.5" stroke="rgba(212,175,55,0.20)" strokeWidth="0.9" fill="none" strokeLinejoin="round"/>
    </svg>
  )
}

function CrownIcon() {
  return (
    <svg width="18" height="13" viewBox="0 0 20 14" fill="none">
      <path d="M 1,12 L 4,4 L 10,8.5 L 16,4 L 19,12 Z" fill="#d4af37" stroke="#8a6010" strokeWidth="0.8"/>
      <circle cx="1" cy="12" r="1.5" fill="#d4af37"/>
      <circle cx="10" cy="8.5" r="1.5" fill="#f5d060"/>
      <circle cx="19" cy="12" r="1.5" fill="#d4af37"/>
      <rect x="1" y="12" width="18" height="2.2" rx="1.1" fill="#d4af37"/>
    </svg>
  )
}

function PlayerSlot({ player, isMe, isEmpty, slotIndex = 0 }) {
  const [phraseIdx, setPhraseIdx] = useState(slotIndex % EMPTY_SLOT_PHRASES.length)

  useEffect(() => {
    if (!isEmpty) return
    const id = setInterval(() => {
      setPhraseIdx(i => (i + 1) % EMPTY_SLOT_PHRASES.length)
    }, 4000 + slotIndex * 700)
    return () => clearInterval(id)
  }, [isEmpty, slotIndex])

  if (isEmpty) {
    return (
      <motion.div
        animate={{ opacity: [0.20, 0.45, 0.20] }}
        transition={{ duration: 2.8, repeat: Infinity, delay: slotIndex * 0.5 }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 18px', borderBottom: '1px solid rgba(212,175,55,0.07)',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          border: '1.5px dashed rgba(212,175,55,0.24)',
          background: 'rgba(0,0,0,0.38)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TikiMaskIcon />
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={phraseIdx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.45 }}
            style={{ fontSize: 13, color: 'rgba(212,175,55,0.32)', fontStyle: 'italic', fontFamily: '"Crimson Text",serif' }}
          >
            {EMPTY_SLOT_PHRASES[phraseIdx]}
          </motion.span>
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 18px', borderBottom: '1px solid rgba(212,175,55,0.08)',
        background: isMe ? 'rgba(212,175,55,0.06)' : 'transparent',
        borderLeft: isMe ? '3px solid rgba(212,175,55,0.5)' : '3px solid transparent',
      }}
    >
      {/* Avatar with optional host crown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <AvatarCircle player={player} size={40} />
        {player.isHost && (
          <div style={{
            position: 'absolute', top: -10, left: '50%',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.6))',
          }}>
            <CrownIcon />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontFamily: '"Cinzel Decorative",cursive',
          color: isMe ? '#f5ead0' : 'rgba(245,234,208,0.80)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontWeight: isMe ? 700 : 500,
        }}>{player.name}</div>
        <div style={{ fontSize: 9, color: 'rgba(212,175,55,0.55)', fontFamily: '"Cinzel Decorative",cursive', letterSpacing: '2px', marginTop: 2 }}>
          {isMe ? 'YOU' : player.isHost ? 'HOST' : ''}
        </div>
      </div>

      <div style={{
        background: isMe
          ? 'linear-gradient(135deg, rgba(212,175,55,0.85), rgba(168,134,42,0.9))'
          : 'rgba(212,175,55,0.12)',
        border: `1px solid ${isMe ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.25)'}`,
        color: isMe ? '#1a0800' : 'rgba(212,175,55,0.7)',
        borderRadius: 5, padding: '3px 9px',
        fontSize: 9, fontFamily: '"Cinzel Decorative",cursive',
        fontWeight: 700, letterSpacing: '1px', flexShrink: 0,
      }}>
        {isMe ? 'YOU' : player.isHost ? 'HOST' : player.name.slice(0, 3).toUpperCase()}
      </div>

      <motion.div
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#30e050', boxShadow: '0 0 8px #30e050', flexShrink: 0 }}
      />
    </motion.div>
  )
}

// ── Warm Fireflies ────────────────────────────────────────────────────────────
function WarmFireflies() {
  // Small LCG so firefly positions stay stable between renders without
  // pulling in the removed three.js seededRng helper.
  let s = 88
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  const flies = Array.from({ length: 22 }, (_, i) => ({
    id: i, x: rng() * 100, y: 15 + rng() * 75,
    driftX: (rng() - 0.5) * 50, driftY: -(30 + rng() * 50),
    dur: 6 + rng() * 8, delay: rng() * 10,
    size: 2 + rng() * 2.5,
    color: rng() > 0.5 ? 'rgba(255,160,20,0.9)' : 'rgba(255,220,60,0.85)',
    glow: rng() > 0.5 ? 'rgba(255,140,10,0.7)' : 'rgba(255,200,40,0.6)',
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
      {flies.map(f => (
        <motion.div
          key={f.id}
          animate={{ y: [0, f.driftY], x: [0, f.driftX], opacity: [0, 0.9, 0.7, 0] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
            width: f.size, height: f.size, borderRadius: '50%',
            background: f.color, boxShadow: `0 0 ${f.size * 2.5}px ${f.glow}`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}



// ── Screen Corner Decorations ─────────────────────────────────────────────────
function ScreenCorner({ position }) {
  const isRight = position.includes('right')
  const isBottom = position.includes('bottom')
  return (
    <div style={{
      position: 'absolute',
      [isBottom ? 'bottom' : 'top']: 0,
      [isRight ? 'right' : 'left']: 0,
      width: 140, height: 140,
      pointerEvents: 'none', zIndex: 5,
    }}>
      <svg
        width="140" height="140" viewBox="0 0 140 140" fill="none"
        style={{ transform: `scale(${isRight ? -1 : 1}, ${isBottom ? -1 : 1})`, transformOrigin: 'center' }}
      >
        <path d="M 0,110 L 0,14 Q 0,0 14,0 L 110,0" stroke="rgba(212,175,55,0.28)" strokeWidth="1.5" fill="none"/>
        <path d="M 0,70 L 0,14 Q 0,0 14,0 L 70,0" stroke="rgba(212,175,55,0.13)" strokeWidth="1" fill="none"/>
        <circle cx="14" cy="14" r="4.5" fill="rgba(212,175,55,0.18)" stroke="rgba(212,175,55,0.38)" strokeWidth="1"/>
        <circle cx="14" cy="14" r="2" fill="rgba(212,175,55,0.40)"/>
        {[22, 38, 54].map(v => (
          <g key={v}>
            <line x1={v} y1="0" x2={v} y2="7" stroke="rgba(212,175,55,0.20)" strokeWidth="1"/>
            <line x1="0" y1={v} x2="7" y2={v} stroke="rgba(212,175,55,0.20)" strokeWidth="1"/>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Tribal Divider ────────────────────────────────────────────────────────────
function TribalDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 clamp(40px, 10vw, 140px)', marginTop: 8 }}>
      <motion.div
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
        style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.22), rgba(212,175,55,0.40))', transformOrigin: 'right' }}
      />
      <div style={{ margin: '0 14px', opacity: 0.45, flexShrink: 0 }}><TikiMaskIcon /></div>
      <motion.div
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ delay: 0.35, duration: 0.9, ease: 'easeOut' }}
        style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.40), rgba(212,175,55,0.22), transparent)', transformOrigin: 'left' }}
      />
    </div>
  )
}

// ── Prophecy Panel (left side) ────────────────────────────────────────────────
const PROPHECY_TEXTS = [
  '"The one who topples last shall reign supreme over the sacred isle."',
  '"When four tikis stand, chaos awakens beneath moonlit skies."',
  '"Stack with wisdom — for every rise invites a great fall."',
  '"The spirits reward cunning hands and fearless hearts alike."',
  '"Tonight the volcano sleeps, but the game never does."',
]

const GAME_RULES = [
  { symbol: '▲', label: 'UP CARDS', text: 'Raise your tiki one, two, or three heights' },
  { symbol: '✕', label: 'TOPPLE', text: 'Send a rival crashing down to earth' },
  { symbol: '◈', label: 'TOAST', text: 'Banish all tikis from the sacred field' },
]

function ProphecyPanel() {
  const [propIdx, setPropIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPropIdx(i => (i + 1) % PROPHECY_TEXTS.length), 6500)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.20, type: 'spring', stiffness: 200, damping: 20 }}
      style={{
        position: 'absolute', top: 110, left: 'clamp(16px, 2.5vw, 40px)',
        bottom: 84, width: 'clamp(240px, 22vw, 298px)',
        display: 'flex', flexDirection: 'column', gap: 14,
        pointerEvents: 'none', overflowY: 'hidden',
      }}
    >
      {/* Oracle scroll */}
      <WoodPanel style={{ padding: '20px 18px 18px' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <motion.div
            animate={{ opacity: [0.45, 0.90, 0.45] }}
            transition={{ duration: 3.2, repeat: Infinity }}
            style={{ fontSize: 9, letterSpacing: '4px', color: 'rgba(212,175,55,0.65)', fontFamily: '"Cinzel Decorative",cursive', marginBottom: 10 }}
          >
            ✦ THE ORACLE SPEAKS ✦
          </motion.div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.28))' }} />
            <div style={{ opacity: 0.38 }}><TikiMaskIcon /></div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.28), transparent)' }} />
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={propIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.55 }}
            style={{
              fontFamily: '"Crimson Text",serif', fontStyle: 'italic',
              fontSize: 14, lineHeight: 1.7,
              color: 'rgba(240,224,180,0.68)',
              textAlign: 'center', margin: 0,
            }}
          >
            {PROPHECY_TEXTS[propIdx]}
          </motion.p>
        </AnimatePresence>
        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 14 }}>
          {PROPHECY_TEXTS.map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: i === propIdx ? 1 : 0.2, scale: i === propIdx ? 1.3 : 1 }}
              transition={{ duration: 0.3 }}
              style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(212,175,55,0.6)' }}
            />
          ))}
        </div>
      </WoodPanel>

      {/* Game rules */}
      <WoodPanel style={{ padding: '16px 18px 14px' }}>
        <div style={{ fontSize: 9, letterSpacing: '4px', color: 'rgba(212,175,55,0.50)', fontFamily: '"Cinzel Decorative",cursive', marginBottom: 14, textAlign: 'center' }}>
          LAWS OF THE ISLAND
        </div>
        {GAME_RULES.map((rule, i) => (
          <motion.div
            key={i}
            initial={{ x: -18, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.45 + i * 0.12 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: i < 2 ? 13 : 0 }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: 'rgba(212,175,55,0.08)',
              border: '1px solid rgba(212,175,55,0.22)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 1,
            }}>
              <span style={{ fontSize: 9, color: 'rgba(212,175,55,0.75)' }}>{rule.symbol}</span>
            </div>
            <div>
              <div style={{ fontSize: 8, letterSpacing: '2px', color: 'rgba(212,175,55,0.55)', fontFamily: '"Cinzel Decorative",cursive', marginBottom: 2 }}>
                {rule.label}
              </div>
              <span style={{ fontSize: 11.5, fontFamily: '"Crimson Text",serif', color: 'rgba(212,175,55,0.45)', lineHeight: 1.45 }}>
                {rule.text}
              </span>
            </div>
          </motion.div>
        ))}
      </WoodPanel>
    </motion.div>
  )
}

// ── Bottom Bar ────────────────────────────────────────────────────────────────
function BottomBar({ players, myPlayerId }) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.55, type: 'spring', stiffness: 180, damping: 22 }}
      style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 76,
        background: 'linear-gradient(180deg, rgba(8,3,0,0) 0%, rgba(10,4,1,0.93) 32%, rgba(8,3,0,0.99) 100%)',
        borderTop: '1px solid rgba(212,175,55,0.13)',
        display: 'flex', alignItems: 'center',
        padding: '0 clamp(20px, 4vw, 60px)', gap: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Left tiki glyph */}
      <div style={{ opacity: 0.28, flexShrink: 0, marginRight: 16 }}>
        <TikiMaskIcon />
      </div>
      <div style={{ width: 1, height: 36, background: 'rgba(212,175,55,0.14)', marginRight: 18, flexShrink: 0 }} />

      {/* Player badges */}
      <div style={{ display: 'flex', gap: 10, flex: 1, alignItems: 'center' }}>
        <AnimatePresence>
          {players?.map(player => {
            const isMe = player.id === myPlayerId
            const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
            return (
              <motion.div
                key={player.id}
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: isMe ? 'rgba(212,175,55,0.09)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isMe ? 'rgba(212,175,55,0.42)' : 'rgba(212,175,55,0.14)'}`,
                  borderRadius: 999, padding: '4px 13px 4px 5px',
                  boxShadow: isMe ? '0 0 14px rgba(212,175,55,0.14)' : 'none',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                  border: `2px solid ${player.color}`,
                  boxShadow: `0 0 8px ${player.color}55`,
                  background: `radial-gradient(circle at 40% 30%, ${player.color}44, rgba(8,2,0,0.9))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {avatar
                    ? <div dangerouslySetInnerHTML={{ __html: avatar.svg }} style={{ width: '82%', height: '82%' }} />
                    : <span style={{ color: 'white', fontSize: 12, fontWeight: 700 }}>{player.name[0]?.toUpperCase()}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontFamily: '"Cinzel Decorative",cursive', color: isMe ? '#f0e0b0' : 'rgba(240,224,176,0.60)', fontWeight: isMe ? 700 : 500, lineHeight: 1.2 }}>
                    {player.name}
                  </div>
                  {isMe && (
                    <div style={{ fontSize: 8, color: 'rgba(212,175,55,0.55)', fontFamily: '"Cinzel Decorative",cursive', letterSpacing: '1.5px' }}>YOU</div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        {/* Ghost slots */}
        {players && Array.from({ length: Math.max(0, 4 - players.length) }, (_, i) => (
          <motion.div
            key={`ghost-${i}`}
            animate={{ opacity: [0.12, 0.28, 0.12] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.5 }}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              border: '1px dashed rgba(212,175,55,0.16)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ opacity: 0.5 }}><TikiMaskIcon /></div>
          </motion.div>
        ))}
      </div>

      {/* Right: ritual mode label */}
      <div style={{ width: 1, height: 36, background: 'rgba(212,175,55,0.14)', marginLeft: 18, flexShrink: 0 }} />
      <div style={{ marginLeft: 16, textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 8, letterSpacing: '2.5px', color: 'rgba(212,175,55,0.35)', fontFamily: '"Cinzel Decorative",cursive', marginBottom: 3 }}>RITUAL MODE</div>
        <div style={{ fontSize: 11, color: 'rgba(212,175,55,0.58)', fontFamily: '"Cinzel Decorative",cursive', letterSpacing: '1px' }}>TIKI TOPPLE</div>
      </div>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LOBBY SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function LobbyScreen() {
  const previousPlayersRef = useRef([])

  const { myRoomCode, myPlayerId, isHost, lobbyPlayers } = useGameStore()
  const { startGame }  = useSocketContext()
  const [copied, setCopied]         = useState(false)
  const [joinToast, setJoinToast]   = useState(null) // { name, color, avatarId }

  const canStart = isHost && lobbyPlayers.length >= 2

  // Show a floating join-toast when a new player enters (skipped on first mount).
  useEffect(() => {
    const prevIds = previousPlayersRef.current.map(p => p.id)
    const isInitialLoad = prevIds.length === 0
    if (!isInitialLoad) {
      const newcomer = lobbyPlayers.find(p => !prevIds.includes(p.id))
      if (newcomer) {
        setJoinToast({ name: newcomer.name, color: newcomer.color, avatarId: newcomer.avatarId })
        const id = setTimeout(() => setJoinToast(null), 3200)
        previousPlayersRef.current = [...lobbyPlayers]
        return () => clearTimeout(id)
      }
    }
    previousPlayersRef.current = [...lobbyPlayers]
  }, [lobbyPlayers])

  const handleStartGame = () => { if (canStart && startGame) startGame() }
  const handleCopy = () => {
    if (!myRoomCode) return
    navigator.clipboard?.writeText(myRoomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div id="lobby-screen" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* r3f jungle scene — same Canvas used by GameScreen (real torch flames,
          palms, ocean, moon, mist). Falls back to a static gradient while the
          bundle loads so the panel never flashes white. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Suspense fallback={<LobbyBackdropFallback />}>
          <IslandJungleScene variant="lobby" />
        </Suspense>
      </div>

      {/* ── Atmosphere Layers ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 55%, transparent 35%, rgba(0,0,0,0.28) 65%, rgba(0,0,0,0.72) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(180deg, rgba(1,4,1,0.92) 0%, rgba(1,4,1,0.50) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 130, background: 'linear-gradient(0deg, rgba(2,6,2,0.90) 0%, transparent 100%)' }} />
        <WarmFireflies />
        <TorchEmbers />
      </div>

      {/* ── Screen Corners ── */}
      <ScreenCorner position="top-left" />
      <ScreenCorner position="top-right" />
      <ScreenCorner position="bottom-left" />
      <ScreenCorner position="bottom-right" />

      {/* ── UI Overlay ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.05 }}
          style={{ textAlign: 'center', paddingTop: 22, pointerEvents: 'none' }}
        >
          <motion.div
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3.2, repeat: Infinity }}
            style={{ fontSize: 10, letterSpacing: '6px', color: 'rgba(212,175,55,0.7)', fontFamily: '"Cinzel Decorative",cursive', marginBottom: 5, textShadow: '0 0 16px rgba(212,175,55,0.4)' }}
          >
            ✦ WAITING ROOM ✦
          </motion.div>
          <motion.h1
            animate={{ filter: ['drop-shadow(0 0 24px rgba(212,175,55,0.45))', 'drop-shadow(0 0 44px rgba(212,175,55,0.85))', 'drop-shadow(0 0 24px rgba(212,175,55,0.45))'] }}
            transition={{ duration: 3.0, repeat: Infinity }}
            style={{
              fontFamily: '"Cinzel Decorative",cursive',
              fontSize: 'clamp(32px, 4.5vw, 56px)',
              fontWeight: 900,
              margin: '0 0 6px',
              letterSpacing: '0.06em',
              // Metallic gold gradient text — matches GameScreen title
              background: 'linear-gradient(180deg, #fbe58a 0%, #f5cb5c 28%, #d4af37 55%, #a67c1d 82%, #7a5810 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextStroke: '0.6px rgba(74,50,8,0.55)',
            }}
          >
            TIKI TOPPLE
          </motion.h1>
          <div style={{ fontSize: 'clamp(9px, 1vw, 12px)', letterSpacing: '4px', color: 'rgba(212,175,55,0.45)', fontFamily: '"Cinzel Decorative",cursive' }}>
            THE ISLAND AWAITS
          </div>
          <TribalDivider />
        </motion.div>

        {/* ── Left Column: Prophecy ── */}
        <ProphecyPanel />

        {/* ── Right Panels ──
            `hide-scrollbar` class (global) suppresses the native scrollbar
            while keeping wheel/touch scrolling. Prevents the horizontal
            scrollbar visible below the panels. */}
        <div className="hide-scrollbar" style={{
          position: 'absolute', top: 110, right: 'clamp(16px, 2.5vw, 40px)',
          bottom: 84,
          width: 'clamp(300px, 26vw, 368px)',
          display: 'flex', flexDirection: 'column', gap: 14,
          pointerEvents: 'auto',
          overflowY: 'auto', overflowX: 'hidden',
        }}>

          {/* Room Code */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <WoodPanel style={{ padding: '18px 22px 14px' }}>
              <div style={{
                fontSize: 9, letterSpacing: '4px', color: 'rgba(212,175,55,0.5)',
                fontFamily: '"Cinzel Decorative",cursive', marginBottom: 10, textAlign: 'center',
              }}>
                ROOM CODE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
                {/* Carved stone room code */}
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
                  <motion.div
                    animate={{
                      textShadow: [
                        '-1px -1px 0px rgba(0,0,0,0.9), 1px 1px 3px rgba(212,175,55,0.25), 0 0 20px rgba(212,175,55,0.35)',
                        '-1px -1px 0px rgba(0,0,0,0.9), 1px 1px 3px rgba(212,175,55,0.55), 0 0 40px rgba(212,175,55,0.70)',
                        '-1px -1px 0px rgba(0,0,0,0.9), 1px 1px 3px rgba(212,175,55,0.25), 0 0 20px rgba(212,175,55,0.35)',
                      ]
                    }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    style={{
                      fontFamily: '"Cinzel Decorative",cursive',
                      fontSize: 'clamp(36px, 4vw, 52px)',
                      fontWeight: 900,
                      color: '#c8a030',
                      letterSpacing: '0.18em',
                      lineHeight: 1,
                      padding: '4px 8px',
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 50%, rgba(255,200,80,0.04) 100%)',
                      borderRadius: 6,
                      boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.7), inset 0 1px 2px rgba(0,0,0,0.9)',
                    }}
                  >
                    {myRoomCode || '----'}
                  </motion.div>
                  {/* Gold shimmer sweep */}
                  <motion.div
                    animate={{ x: ['-120%', '220%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute', top: 0, bottom: 0,
                      width: '40%',
                      background: 'linear-gradient(105deg, transparent 0%, rgba(255,220,100,0.22) 45%, rgba(255,240,160,0.38) 55%, transparent 100%)',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.06, boxShadow: '0 0 18px rgba(40,160,20,0.55)' }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleCopy}
                  style={{
                    background: copied
                      ? 'linear-gradient(135deg, #1a6030, #0e4020)'
                      : 'linear-gradient(135deg, #1a5a18, #0e3e10)',
                    border: `1.5px solid ${copied ? 'rgba(40,200,80,0.7)' : 'rgba(30,160,20,0.6)'}`,
                    borderRadius: 9, color: copied ? '#50e880' : '#60d040',
                    padding: '9px 14px', fontSize: 10,
                    fontFamily: '"Cinzel Decorative",cursive',
                    cursor: 'pointer', minWidth: 88, letterSpacing: '1px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    transition: 'all 0.22s', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                          <path d="M 2,7 L 5.5,10.5 L 12,3" stroke="#50e880" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        COPIED
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                          <rect x="4" y="1" width="9" height="9" rx="1.5" stroke="#60d040" strokeWidth="1.4"/>
                          <path d="M 1,5 L 1,13 L 9,13" stroke="#60d040" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        </svg>
                        COPY
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
              <p style={{
                textAlign: 'center', fontSize: 11.5, margin: 0,
                color: 'rgba(212,175,55,0.38)', fontStyle: 'italic',
                fontFamily: '"Crimson Text",serif',
              }}>
                Share this code with friends to join
              </p>
            </WoodPanel>
          </motion.div>

          {/* Players */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.28, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <WoodPanel>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                padding: '14px 18px 11px',
                borderBottom: '1px solid rgba(212,175,55,0.12)',
              }}>
                <span style={{
                  fontSize: 9, letterSpacing: '4px', color: 'rgba(212,175,55,0.6)',
                  fontFamily: '"Cinzel Decorative",cursive',
                }}>PLAYERS</span>
                {/* SVG arc progress */}
                <div style={{ position: 'relative', width: 40, height: 40 }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="3"/>
                    <motion.circle
                      cx="20" cy="20" r="16"
                      fill="none" stroke="#d4af37" strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 16}`}
                      animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - lobbyPlayers.length / 4) }}
                      initial={{ strokeDashoffset: 2 * Math.PI * 16 }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#d4af37', fontWeight: 700,
                    fontFamily: '"Cinzel Decorative",cursive',
                  }}>
                    {lobbyPlayers.length}/4
                  </div>
                </div>
              </div>
              <div>
                <AnimatePresence>
                  {lobbyPlayers.map(player => (
                    <PlayerSlot key={player.id} player={player} isMe={player.id === myPlayerId} />
                  ))}
                </AnimatePresence>
                {Array.from({ length: Math.max(0, 4 - lobbyPlayers.length) }, (_, i) => (
                  <PlayerSlot key={`empty-${i}`} isEmpty slotIndex={i} />
                ))}
              </div>
            </WoodPanel>
          </motion.div>

          {/* Start / Wait */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.40, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <WoodPanel style={{ padding: '18px 20px 16px' }}>
              {isHost ? (
                <>
                  <motion.button
                    whileHover={canStart ? { scale: 1.025, boxShadow: '0 8px 30px rgba(212,175,55,0.5), inset 0 1px 0 rgba(255,255,255,0.25)' } : {}}
                    whileTap={canStart ? { scale: 0.97 } : {}}
                    onClick={handleStartGame}
                    disabled={!canStart}
                    animate={canStart ? {
                      boxShadow: [
                        '0 4px 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 3px 0 rgba(20,12,0,0.8)',
                        '0 6px 32px rgba(212,175,55,0.55), inset 0 1px 0 rgba(255,255,255,0.25), 0 3px 0 rgba(20,12,0,0.8)',
                        '0 4px 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 3px 0 rgba(20,12,0,0.8)',
                      ],
                    } : {
                      borderColor: ['rgba(212,175,55,0.16)', 'rgba(212,175,55,0.36)', 'rgba(212,175,55,0.16)'],
                    }}
                    transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      width: '100%', padding: '15px 24px',
                      background: canStart
                        ? 'linear-gradient(160deg, #c8a030 0%, #a07820 25%, #6a5010 60%, #3a2c08 100%)'
                        : 'rgba(30,14,3,0.7)',
                      border: canStart
                        ? '2px solid rgba(212,175,55,0.65)'
                        : '1.5px solid rgba(212,175,55,0.18)',
                      borderRadius: 12,
                      color: canStart ? '#fff8e8' : 'rgba(212,175,55,0.38)',
                      fontSize: canStart ? 15 : 13, fontFamily: '"Cinzel Decorative",cursive',
                      fontWeight: 900, letterSpacing: '0.08em',
                      cursor: canStart ? 'pointer' : 'not-allowed',
                      transition: 'background 0.3s, color 0.3s',
                      textShadow: canStart ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    }}
                  >
                    {canStart ? (
                      <span>⚡ BEGIN THE RITUAL</span>
                    ) : (
                      <>
                        <span>THE RITUAL AWAITS</span>
                        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {[0, 1, 2].map(i => (
                            <motion.span
                              key={i}
                              animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                              transition={{ duration: 1.4, delay: i * 0.22, repeat: Infinity, ease: 'easeInOut' }}
                              style={{
                                display: 'inline-block', width: 5, height: 5, borderRadius: '50%',
                                background: 'rgba(212,175,55,0.55)',
                              }}
                            />
                          ))}
                        </span>
                      </>
                    )}
                  </motion.button>
                  {!canStart && (
                    <p style={{
                      textAlign: 'center', fontSize: 11.5, margin: '10px 0 0',
                      color: 'rgba(212,175,55,0.28)', fontStyle: 'italic',
                      fontFamily: '"Crimson Text",serif',
                    }}>
                      The ritual begins when all warriors assemble
                    </p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <motion.div
                    animate={{ opacity: [0.45, 0.95, 0.45] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    style={{
                      fontSize: 14, color: '#d4af37',
                      fontFamily: '"Cinzel Decorative",cursive',
                      marginBottom: 8, letterSpacing: '0.05em',
                      textShadow: '0 0 16px rgba(212,175,55,0.4)',
                    }}
                  >
                    ⌛ WAITING FOR PLAYERS
                  </motion.div>
                  <p style={{
                    fontSize: 12, color: 'rgba(212,175,55,0.35)', margin: 0,
                    fontStyle: 'italic', fontFamily: '"Crimson Text",serif',
                  }}>
                    The host will start the game
                  </p>
                </div>
              )}
            </WoodPanel>
          </motion.div>
        </div>

        {/* ── Bottom Bar ── */}
        <BottomBar players={lobbyPlayers} myPlayerId={myPlayerId} />
      </div>

      {/* ── Player join toast (bottom-left) ── */}
      <AnimatePresence>
        {joinToast && (
          <motion.div
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{
              position: 'absolute', bottom: 36, left: 24, zIndex: 100,
              background: 'linear-gradient(135deg, rgba(22,10,2,0.97) 0%, rgba(14,6,1,0.98) 100%)',
              border: `1.5px solid ${joinToast.color ?? 'rgba(212,175,55,0.55)'}`,
              borderRadius: 14, padding: '12px 20px 12px 14px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.75), 0 0 20px ${joinToast.color ?? 'rgba(212,175,55,0.12)'}44`,
              pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 12,
              minWidth: 220,
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${joinToast.color}`,
              boxShadow: `0 0 12px ${joinToast.color}88`,
              background: `radial-gradient(circle at 40% 30%, ${joinToast.color}55, rgba(10,4,0,0.9))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              {joinToast.avatarId && AVATAR_MAP[joinToast.avatarId]
                ? <div dangerouslySetInnerHTML={{ __html: AVATAR_MAP[joinToast.avatarId].svg }} style={{ width: '82%', height: '82%' }} />
                : <span style={{ color: 'white', fontSize: 15, fontWeight: 700 }}>{joinToast.name[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 13, fontFamily: '"Cinzel Decorative",cursive', color: '#f0d878', fontWeight: 700, marginBottom: 2 }}>
                {joinToast.name}
              </div>
              <div style={{ fontSize: 11, fontFamily: '"Crimson Text",serif', fontStyle: 'italic', color: 'rgba(212,175,55,0.6)' }}>
                entered the arena
              </div>
            </div>
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: 'absolute', left: 14, top: '50%', marginTop: -20,
                width: 40, height: 40, borderRadius: '50%',
                border: `1.5px solid ${joinToast.color}`,
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        #lobby-screen * { box-sizing: border-box; }
        @media (max-width: 640px) {
          #lobby-screen h1 { font-size: 28px !important; }
          #lobby-screen [data-panels] { top: 80px !important; right: 10px !important; width: calc(100vw - 20px) !important; }
        }
      `}</style>
    </div>
  )
}
