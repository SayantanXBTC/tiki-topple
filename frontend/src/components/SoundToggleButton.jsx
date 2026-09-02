import { useEffect } from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useSoundEngine } from '../hooks/useSoundEngine'

/**
 * Small circular gold button that toggles the ambient jungle music.
 * Reads / writes `settings.musicEnabled` in the shared game store and
 * starts / stops the ambient loop via useSoundEngine. Reuse this on
 * Home / Lobby / Profile screens so the player has one consistent control.
 */
export default function SoundToggleButton({ style }) {
  const sound         = useSoundEngine()
  const musicEnabled  = useGameStore(s => s.settings.musicEnabled)
  const masterVolume  = useGameStore(s => s.settings.masterVolume)
  const updateSettings = useGameStore(s => s.updateSettings)

  useEffect(() => {
    if (musicEnabled) sound.startAmbient()
    else sound.stopAmbient()
  }, [sound, musicEnabled])

  useEffect(() => {
    sound.setMasterVolume?.(masterVolume)
  }, [sound, masterVolume])

  const on = musicEnabled

  return (
    <motion.button
      whileHover={{ scale: 1.10 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => updateSettings({ musicEnabled: !musicEnabled })}
      aria-label={`Ambient music: ${on ? 'on' : 'off'} — click to toggle`}
      aria-pressed={on}
      title={on ? 'Mute jungle music' : 'Play jungle music'}
      style={{
        background: on
          ? 'radial-gradient(circle at 30% 25%, #fbe58a 0%, #d4af37 45%, #7a5810 100%)'
          : 'radial-gradient(circle at 30% 25%, #6a4a10 0%, #3a2808 55%, #1a1204 100%)',
        border: on ? '1.5px solid #4a3208' : '1.5px solid #2a1c04',
        borderRadius: '50%',
        width: 40, height: 40,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: on ? '#1a0a00' : 'rgba(212,175,55,0.55)',
        boxShadow: on
          ? '0 4px 14px rgba(0,0,0,0.7), 0 0 18px rgba(212,175,55,0.35), inset 0 1px 0 rgba(255,225,140,0.45), inset 0 -2px 4px rgba(0,0,0,0.3)'
          : '0 4px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,225,140,0.15), inset 0 -2px 4px rgba(0,0,0,0.4)',
        ...style,
      }}
    >
      {on
        ? (
          // Speaker + wave (on)
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M18.54 5.46a9 9 0 0 1 0 12.07" />
          </svg>
        ) : (
          // Speaker + slash (off)
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )
      }
    </motion.button>
  )
}
