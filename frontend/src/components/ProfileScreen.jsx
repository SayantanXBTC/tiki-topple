import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import useGameStore from '../store/gameStore'
import { loadProfileStats, loadProfileStatsSync } from '../utils/profileStats'

// ── Rank label ────────────────────────────────────────────────────────────────
function getRank(stats) {
  const { wins, gamesPlayed, highScore } = stats
  if (wins >= 20)      return { title: 'Tiki God',     color: '#ff4400', glow: '#ff6600' }
  if (wins >= 10)      return { title: 'Grand Shaman',  color: '#d4af37', glow: '#ffd700' }
  if (wins >= 5)       return { title: 'War Chief',     color: '#c084fc', glow: '#a855f7' }
  if (wins >= 1)       return { title: 'Tiki Champion', color: '#4ade80', glow: '#22c55e' }
  if (gamesPlayed >= 3)return { title: 'Apprentice',    color: '#60a5fa', glow: '#3b82f6' }
  return                      { title: 'Initiate',       color: '#94a3b8', glow: '#64748b' }
}

// ── Achievement definitions ────────────────────────────────────────────────────
function getAchievements(stats) {
  const { wins, gamesPlayed, highScore } = stats
  return [
    { id: 'first_win',   icon: '🏆', label: 'First Victory',   desc: 'Win your first game',          unlocked: wins >= 1        },
    { id: 'veteran',     icon: '⚔',  label: 'Tiki Veteran',    desc: 'Play 10 games',                 unlocked: gamesPlayed >= 10 },
    { id: 'shaman',      icon: '🔮', label: 'Grand Shaman',    desc: 'Win 10 games',                  unlocked: wins >= 10       },
    { id: 'high_scorer', icon: '⭐', label: 'High Scorer',     desc: 'Score 15+ in a single game',    unlocked: highScore >= 15   },
    { id: 'legend',      icon: '👑', label: 'Tiki Legend',     desc: 'Win 20 games',                  unlocked: wins >= 20       },
    { id: 'prolific',    icon: '🌺', label: 'Island Explorer', desc: 'Play 25 games',                 unlocked: gamesPlayed >= 25 },
  ]
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function ProfileAvatar({ user, size = 96 }) {
  const [imgErr, setImgErr] = useState(false)
  const initial = (user?.displayName || user?.email || 'T').slice(0, 1).toUpperCase()

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '3px solid rgba(212,175,55,0.6)',
      boxShadow: '0 0 24px rgba(212,175,55,0.3), 0 0 60px rgba(212,175,55,0.1)',
      overflow: 'hidden', flexShrink: 0, position: 'relative',
      background: 'radial-gradient(ellipse at 50% 30%, #3d1a00, #1a0800)',
    }}>
      {user?.photoURL && !imgErr ? (
        <img
          src={user.photoURL}
          alt={user.displayName || 'avatar'}
          onError={() => setImgErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #3d1a00 0%, #1a0a00 100%)',
        }}>
          <span style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: size * 0.38,
            fontWeight: 900,
            color: '#d4af37',
            textShadow: '0 0 20px rgba(212,175,55,0.6)',
          }}>{initial}</span>
        </div>
      )}
      {/* Gold rim overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        background: 'radial-gradient(ellipse at 35% 25%, rgba(212,175,55,0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
    </div>
  )
}

// ── Stat card — royal metallic frame w/ corner filigree ─────────────────────
function StatCard({ label, value, sublabel, accent = '#d4af37', delay = 0 }) {
  const Corner = ({ pos }) => {
    const s = 10
    const styles = {
      tl: { top: 5, left: 5, borderTop: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}` },
      tr: { top: 5, right: 5, borderTop: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}` },
      bl: { bottom: 5, left: 5, borderBottom: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}` },
      br: { bottom: 5, right: 5, borderBottom: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}` },
    }
    return <div style={{ position: 'absolute', width: s, height: s, opacity: 0.65, ...styles[pos] }} />
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.04, y: -3 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
      style={{
        background: 'linear-gradient(160deg, rgba(30,12,0,0.94) 0%, rgba(10,4,0,0.98) 100%)',
        border: '1.5px solid transparent',
        borderRadius: 16,
        backgroundImage: `linear-gradient(160deg, rgba(30,12,0,0.94), rgba(10,4,0,0.98)),
                          linear-gradient(135deg, #7a5810 0%, ${accent} 30%, #fbe58a 50%, ${accent} 70%, #7a5810 100%)`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        padding: '22px 16px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        boxShadow: `0 0 28px ${accent}12, 0 10px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,225,140,0.18)`,
        position: 'relative', overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      <div style={{
        position: 'absolute', top: 0, left: 20, right: 20, height: 1,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        boxShadow: `0 0 8px ${accent}66`,
      }} />
      <span style={{
        fontFamily: '"Cinzel Decorative", serif',
        fontSize: 30, fontWeight: 900,
        background: `linear-gradient(180deg, #fff2b8, ${accent}, #7a5810)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        filter: `drop-shadow(0 0 12px ${accent}66)`,
        lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontFamily: '"Cinzel Decorative", serif',
        fontSize: 9, letterSpacing: '0.18em', fontWeight: 700,
        color: 'rgba(245,234,208,0.6)', textAlign: 'center',
      }}>{label}</span>
      {sublabel && (
        <span style={{ fontSize: 10.5, color: `${accent}aa`, fontFamily: '"Crimson Text", serif', fontStyle: 'italic' }}>
          {sublabel}
        </span>
      )}
    </motion.div>
  )
}

// ── Achievement badge ─────────────────────────────────────────────────────────
function AchievementBadge({ achievement, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: achievement.unlocked ? 1 : 0.35, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: achievement.unlocked
          ? 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.04) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: achievement.unlocked
          ? '1px solid rgba(212,175,55,0.35)'
          : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        filter: achievement.unlocked ? 'none' : 'grayscale(80%)',
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{achievement.icon}</span>
      <div>
        <div style={{
          fontFamily: '"Cinzel Decorative", cursive',
          fontSize: 10.5, fontWeight: 700,
          color: achievement.unlocked ? '#d4af37' : 'rgba(245,234,208,0.35)',
          letterSpacing: '0.04em',
        }}>{achievement.label}</div>
        <div style={{
          fontSize: 11, color: 'rgba(245,234,208,0.4)',
          fontFamily: '"Crimson Text", serif', fontStyle: 'italic', marginTop: 1,
        }}>{achievement.desc}</div>
      </div>
      {achievement.unlocked && (
        <div style={{
          marginLeft: 'auto', flexShrink: 0,
          width: 20, height: 20, borderRadius: '50%',
          background: 'linear-gradient(135deg, #d4af37, #a8860a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: '#1a0800', fontWeight: 900,
        }}>✓</div>
      )}
    </motion.div>
  )
}

// ── Recent game row ───────────────────────────────────────────────────────────
function RecentGameRow({ game, delay }) {
  const placeColors = ['#d4af37', '#94a3b8', '#b45309']
  const placeLabels = ['1st', '2nd', '3rd', '4th']
  const placeColor = placeColors[game.place - 1] || 'rgba(245,234,208,0.4)'

  return (
    <motion.div
      initial={{ x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 240, damping: 24 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px',
        background: game.isWin
          ? 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.03) 100%)'
          : 'rgba(255,255,255,0.03)',
        border: game.isWin
          ? '1px solid rgba(212,175,55,0.2)'
          : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, marginBottom: 6,
      }}
    >
      {/* Place */}
      <div style={{
        width: 32, flexShrink: 0, textAlign: 'center',
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: 11, fontWeight: 900,
        color: placeColor,
        textShadow: `0 0 8px ${placeColor}66`,
      }}>
        {placeLabels[game.place - 1] || `#${game.place}`}
      </div>

      {/* Score */}
      <div style={{
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: 18, fontWeight: 900,
        color: game.isWin ? '#d4af37' : 'rgba(245,234,208,0.6)',
        minWidth: 30,
      }}>
        {game.myScore}
      </div>

      {/* vs players */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'rgba(245,234,208,0.45)',
          fontFamily: '"Crimson Text", serif', fontStyle: 'italic',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          vs {game.players.filter((_, i) => i !== game.place - 1).slice(0, 3).map(p => p.name).join(', ')}
        </div>
      </div>

      {/* Date */}
      <div style={{
        fontSize: 9.5, color: 'rgba(245,234,208,0.3)',
        fontFamily: '"Cinzel Decorative", cursive',
        flexShrink: 0, letterSpacing: '0.05em',
      }}>
        {game.date}
      </div>

      {/* Win badge */}
      {game.isWin && (
        <div style={{
          background: 'linear-gradient(135deg, #d4af37, #a8860a)',
          borderRadius: 20, padding: '2px 8px',
          fontSize: 7.5, fontFamily: '"Cinzel Decorative", cursive',
          color: '#1a0800', fontWeight: 900, letterSpacing: '0.1em', flexShrink: 0,
        }}>WIN</div>
      )}
    </motion.div>
  )
}

// ── ProfileScreen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const { user } = useAuth()
  const setScreen = useGameStore(s => s.setScreen)
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('stats') // 'stats' | 'history' | 'achievements'

  useEffect(() => {
    if (!user?.uid) return
    // Show cached stats instantly so the UI isn't empty during the Firestore fetch
    setStats(loadProfileStatsSync(user.uid))
    // Then hydrate w/ authoritative Firestore data
    let cancelled = false
    loadProfileStats(user.uid).then(fresh => { if (!cancelled) setStats(fresh) })
    return () => { cancelled = true }
  }, [user?.uid])

  if (!user || !stats) return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% 0%, #1a0800 0%, #0d0400 60%, #06020c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        fontFamily: '"Cinzel Decorative", cursive',
        color: 'rgba(212,175,55,0.5)', fontSize: 14, letterSpacing: '0.2em',
      }}>LOADING...</div>
    </div>
  )

  const rank = getRank(stats)
  const achievements = getAchievements(stats)
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0
  const avgScore = stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'radial-gradient(ellipse at 50% -10%, #1e0a00 0%, #0d0400 50%, #06020c 100%)',
      overflowY: 'auto', overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      fontFamily: '"Crimson Text", serif',
    }}>
      {/* Background particles */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(212,100,0,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(212,175,55,0.04) 0%, transparent 40%)',
      }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        height: 56,
        background: 'rgba(8,3,0,0.88)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(212,175,55,0.28)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        <motion.button
          whileHover={{ scale: 1.08, x: -2 }} whileTap={{ scale: 0.93 }}
          onClick={() => setScreen('home')}
          style={{
            background: 'rgba(212,175,55,0.08)',
            border: '1px solid rgba(212,175,55,0.32)',
            borderRadius: 20, padding: '6px 14px',
            color: '#d4af37', fontSize: 12,
            fontFamily: '"Cinzel Decorative", cursive',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          HOME
        </motion.button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 13, fontWeight: 900,
            color: 'rgba(212,175,55,0.7)', letterSpacing: '0.18em',
          }}>WARRIOR PROFILE</span>
        </div>

        <div style={{ width: 80 }} /> {/* balance */}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '28px 18px 80px' }}>

        {/* ── Hero card — avatar + name + rank ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          style={{
            background: 'linear-gradient(160deg, rgba(30,12,0,0.97) 0%, rgba(12,5,0,0.98) 100%)',
            border: '1.5px solid rgba(212,175,55,0.28)',
            borderRadius: 20,
            padding: '28px 24px 22px',
            marginBottom: 20,
            boxShadow: '0 0 40px rgba(212,175,55,0.08), 0 16px 48px rgba(0,0,0,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            position: 'relative', overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Top divider */}
          <div style={{
            position: 'absolute', top: 0, left: 40, right: 40, height: 2,
            background: 'linear-gradient(90deg, transparent, #d4af37cc, transparent)',
            borderRadius: 2,
          }} />

          <ProfileAvatar user={user} size={92} />

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: '"Cinzel Decorative", cursive',
              fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 900,
              color: '#f5ead0', letterSpacing: '0.04em', marginBottom: 4,
            }}>
              {user.displayName || user.email?.split('@')[0] || 'Tiki Warrior'}
            </div>
            <div style={{
              fontSize: 12, color: 'rgba(245,234,208,0.38)',
              fontStyle: 'italic', marginBottom: 10,
            }}>
              {user.email}
            </div>

            {/* Rank badge */}
            <motion.div
              animate={{
                boxShadow: [`0 0 12px ${rank.glow}40`, `0 0 24px ${rank.glow}70`, `0 0 12px ${rank.glow}40`],
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `linear-gradient(135deg, ${rank.glow}18 0%, ${rank.glow}08 100%)`,
                border: `1.5px solid ${rank.color}50`,
                borderRadius: 20, padding: '5px 16px',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: rank.color,
                boxShadow: `0 0 8px ${rank.glow}`,
              }} />
              <span style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 11, fontWeight: 900,
                color: rank.color, letterSpacing: '0.1em',
                textShadow: `0 0 12px ${rank.glow}80`,
              }}>{rank.title}</span>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Stats grid ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <StatCard label="GAMES PLAYED" value={stats.gamesPlayed} accent="#60a5fa" delay={0.1} />
          <StatCard label="VICTORIES"    value={stats.wins}        accent="#d4af37" delay={0.15} sublabel={`${winRate}% win rate`} />
          <StatCard label="BEST SCORE"   value={stats.highScore}   accent="#f87171" delay={0.2} />
          <StatCard label="AVG SCORE"    value={avgScore}           accent="#4ade80" delay={0.25} sublabel={`${stats.totalScore} total`} />
        </div>

        {/* ── Tab nav ──────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 0,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(212,175,55,0.18)',
          borderRadius: 12, overflow: 'hidden',
          marginBottom: 16,
        }}>
          {[['history', 'Recent Games'], ['achievements', 'Achievements']].map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '10px 12px',
                background: tab === t
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.08))'
                  : 'transparent',
                border: 'none',
                borderRight: t === 'history' ? '1px solid rgba(212,175,55,0.15)' : 'none',
                color: tab === t ? '#d4af37' : 'rgba(245,234,208,0.4)',
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 9.5, letterSpacing: '0.1em',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {tab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {stats.recentGames.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '40px 20px',
                  color: 'rgba(245,234,208,0.3)',
                  fontFamily: '"Cinzel Decorative", cursive',
                  fontSize: 11, letterSpacing: '0.12em',
                }}>
                  No games played yet.<br />
                  <span style={{ fontSize: 10, display: 'block', marginTop: 8, opacity: 0.6 }}>
                    Challenge the volcano gods to begin your legend.
                  </span>
                </div>
              ) : (
                stats.recentGames.map((game, i) => (
                  <RecentGameRow key={i} game={game} delay={i * 0.06} />
                ))
              )}
            </motion.div>
          )}

          {tab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {achievements.map((a, i) => (
                <AchievementBadge key={a.id} achievement={a} delay={i * 0.06} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
