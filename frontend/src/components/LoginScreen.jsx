import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../firebase'

// ── Seeded RNG ────────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

// ── Google Icon ───────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" style={{ marginRight: 9, flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

// ── Stone Tile Grid ───────────────────────────────────────────────────────────
const TILE_COLORS = [
  ['#1a1410', '#120e09'],
  ['#1e1812', '#150f0a'],
  ['#161210', '#100c08'],
  ['#1c160e', '#130e09'],
  ['#18140e', '#11090a'],
  ['#201a12', '#170f0a'],
]

function StoneTileRow({ rowIndex }) {
  const [light, dark] = TILE_COLORS[rowIndex % TILE_COLORS.length]
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4 + rowIndex * 0.6, delay: rowIndex * 0.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ display: 'flex', flex: '1 0 0', willChange: 'transform' }}
    >
      {Array.from({ length: 9 }, (_, col) => (
        <div key={col} style={{
          flex: '1 0 0', position: 'relative', overflow: 'hidden',
          background: `linear-gradient(145deg, ${light} 0%, ${dark} 100%)`,
          border: '2px solid rgba(0,0,0,0.7)',
          boxShadow: 'inset 0 1px 0 rgba(60,50,30,0.08)',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent 0px, transparent 9px, rgba(0,0,0,0.18) 9px, rgba(0,0,0,0.18) 10px)',
          }} />
          <div style={{ position: 'absolute', top: 0, left: 4, right: 4, height: 1, background: 'rgba(80,60,30,0.15)' }} />
          {(col * 3 + rowIndex * 7) % 11 < 4 && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 35% 45%, rgba(15,40,8,0.3) 0%, transparent 65%)',
            }} />
          )}
        </div>
      ))}
    </motion.div>
  )
}

function StoneTileGrid() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', opacity: 0.65, zIndex: 0,
    }}>
      {Array.from({ length: 6 }, (_, i) => <StoneTileRow key={i} rowIndex={i} />)}
    </div>
  )
}

// ── Top Jungle Canopy ─────────────────────────────────────────────────────────
function JungleCanopy() {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20vh', zIndex: 7, pointerEvents: 'none', overflow: 'hidden' }}>
      <svg viewBox="0 0 1200 150" width="100%" height="100%" preserveAspectRatio="xMidYMin meet" fill="none">
        {/* Dense dark leaf base layer */}
        <ellipse cx="60"   cy="25"  rx="105" ry="68" fill="#060e05" opacity="0.98"/>
        <ellipse cx="195"  cy="15"  rx="92"  ry="62" fill="#081408" opacity="0.96"/>
        <ellipse cx="140"  cy="42"  rx="82"  ry="55" fill="#040a04" opacity="0.99"/>
        <ellipse cx="370"  cy="20"  rx="98"  ry="64" fill="#071208" opacity="0.95"/>
        <ellipse cx="505"  cy="10"  rx="88"  ry="58" fill="#0a1c08" opacity="0.92"/>
        <ellipse cx="615"  cy="28"  rx="105" ry="67" fill="#050e05" opacity="0.98"/>
        <ellipse cx="740"  cy="14"  rx="92"  ry="61" fill="#081608" opacity="0.95"/>
        <ellipse cx="870"  cy="25"  rx="98"  ry="65" fill="#071408" opacity="0.97"/>
        <ellipse cx="1000" cy="12"  rx="87"  ry="57" fill="#091808" opacity="0.94"/>
        <ellipse cx="1110" cy="32"  rx="94"  ry="62" fill="#050e05" opacity="0.98"/>
        <ellipse cx="1210" cy="22"  rx="105" ry="67" fill="#071408" opacity="0.96"/>
        {/* Mid leaf layer – brighter */}
        <ellipse cx="90"   cy="52"  rx="72"  ry="46" fill="#0c2208" opacity="0.82"/>
        <ellipse cx="280"  cy="42"  rx="78"  ry="50" fill="#102808" opacity="0.78"/>
        <ellipse cx="470"  cy="40"  rx="72"  ry="46" fill="#0c2208" opacity="0.80"/>
        <ellipse cx="660"  cy="53"  rx="82"  ry="52" fill="#112808" opacity="0.82"/>
        <ellipse cx="850"  cy="44"  rx="74"  ry="48" fill="#0c2208" opacity="0.78"/>
        <ellipse cx="1040" cy="48"  rx="77"  ry="50" fill="#0e2508" opacity="0.82"/>
        {/* Vine drapes from canopy edge */}
        {[55, 145, 260, 395, 530, 655, 780, 920, 1065].map((x, i) => (
          <path
            key={x}
            d={`M ${x} 0 C ${x+(i%2===0?6:-6)} 35 ${x+(i%2===0?-9:9)} 68 ${x+(i%2===0?5:-5)} 100 C ${x+(i%2===0?-6:6)} 120 ${x} 132 ${x+(i%2===0?4:-4)} 150`}
            stroke={i % 3 === 0 ? '#1a4a12' : '#256e1e'}
            strokeWidth={i % 2 === 0 ? 3.5 : 2}
            strokeLinecap="round"
          />
        ))}
        {/* Leaf tips poking down */}
        {[30, 120, 230, 340, 460, 590, 710, 840, 970, 1100].map((x, i) => (
          <ellipse key={x} cx={x} cy={75} rx={22 + i % 3 * 5} ry={12} fill={i%2===0 ? '#122c08' : '#0e2006'} opacity="0.7" transform={`rotate(${i%2===0?8:-8} ${x} 75)`}/>
        ))}
        {/* Gradient fade to transparent at bottom */}
        <defs>
          <linearGradient id="cFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#040904" stopOpacity="0"/>
            <stop offset="100%" stopColor="#020602" stopOpacity="0.55"/>
          </linearGradient>
        </defs>
        <rect x="0" y="95" width="1200" height="55" fill="url(#cFade)"/>
      </svg>
    </div>
  )
}

// ── Ground Roots ──────────────────────────────────────────────────────────────
function GroundRoots() {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '32vh', zIndex: 7, pointerEvents: 'none' }}>
      <svg viewBox="0 0 1200 280" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" fill="none">
        {/* Left root mass */}
        <path d="M 0 280 C 45 238 110 218 185 205 C 260 192 330 196 405 182 C 468 170 518 158 570 164" stroke="#160e06" strokeWidth="24" strokeLinecap="round"/>
        <path d="M 0 280 C 35 252 92 236 162 224 C 228 213 300 216 372 203" stroke="#1e1208" strokeWidth="18" strokeLinecap="round"/>
        <path d="M 0 272 C 55 245 130 224 215 212 C 290 202 360 206 430 196" stroke="#1a1006" strokeWidth="12" strokeLinecap="round"/>
        <path d="M 0 260 C 70 232 165 215 260 204 C 330 196 400 200 470 190" stroke="#120c04" strokeWidth="7" strokeLinecap="round"/>
        <path d="M 0 275 C 90 250 200 234 310 222" stroke="#1a1006" strokeWidth="4.5" strokeLinecap="round"/>
        {/* Left upward branch roots */}
        <path d="M 120 255 C 140 230 170 210 200 195 C 240 178 280 175 320 165" stroke="#160e06" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 80 265 C 100 240 135 218 170 205" stroke="#120c04" strokeWidth="6" strokeLinecap="round"/>
        <path d="M 200 240 C 230 215 270 198 310 188 C 350 178 390 180 430 170" stroke="#160e06" strokeWidth="7" strokeLinecap="round"/>
        {/* Left moss pads */}
        <ellipse cx="110" cy="272" rx="88" ry="22" fill="#091a05" opacity="0.7"/>
        <ellipse cx="270" cy="276" rx="65" ry="16" fill="#0b1e06" opacity="0.55"/>
        <ellipse cx="50"  cy="278" rx="50" ry="14" fill="#060e04" opacity="0.8"/>

        {/* Right root mass */}
        <path d="M 1200 280 C 1155 238 1090 218 1015 205 C 940 192 870 196 795 182 C 732 170 682 158 630 164" stroke="#160e06" strokeWidth="24" strokeLinecap="round"/>
        <path d="M 1200 280 C 1165 252 1108 236 1038 224 C 972 213 900 216 828 203" stroke="#1e1208" strokeWidth="18" strokeLinecap="round"/>
        <path d="M 1200 272 C 1145 245 1070 224 985 212 C 910 202 840 206 770 196" stroke="#1a1006" strokeWidth="12" strokeLinecap="round"/>
        <path d="M 1200 260 C 1130 232 1035 215 940 204 C 870 196 800 200 730 190" stroke="#120c04" strokeWidth="7" strokeLinecap="round"/>
        <path d="M 1200 275 C 1110 250 1000 234 890 222" stroke="#1a1006" strokeWidth="4.5" strokeLinecap="round"/>
        {/* Right upward branches */}
        <path d="M 1080 255 C 1060 230 1030 210 1000 195 C 960 178 920 175 880 165" stroke="#160e06" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 1120 265 C 1100 240 1065 218 1030 205" stroke="#120c04" strokeWidth="6" strokeLinecap="round"/>
        <path d="M 1000 240 C 970 215 930 198 890 188 C 850 178 810 180 770 170" stroke="#160e06" strokeWidth="7" strokeLinecap="round"/>
        {/* Right moss */}
        <ellipse cx="1090" cy="272" rx="88" ry="22" fill="#091a05" opacity="0.7"/>
        <ellipse cx="930"  cy="276" rx="65" ry="16" fill="#0b1e06" opacity="0.55"/>
        <ellipse cx="1150" cy="278" rx="50" ry="14" fill="#060e04" opacity="0.8"/>

        {/* Center bottom ground seal */}
        <ellipse cx="600" cy="278" rx="580" ry="22" fill="#060e04" opacity="0.88"/>
        <ellipse cx="600" cy="280" rx="600" ry="16" fill="#040a03" opacity="0.95"/>
      </svg>
    </div>
  )
}

// ── Side Vines ────────────────────────────────────────────────────────────────
function SideVine({ x, fromRight, dur, delay, curveDir = 1 }) {
  const gId = `svg_${x}_${fromRight ? 'r' : 'l'}`
  return (
    <motion.div
      animate={{ rotate: [-2.2, 2.2, -2.2] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', top: 0,
        ...(fromRight ? { right: x } : { left: x }),
        transformOrigin: 'top center',
        willChange: 'transform', zIndex: 6, pointerEvents: 'none',
      }}
    >
      <svg width="100" height="580" viewBox="0 0 100 580" fill="none">
        <defs>
          <linearGradient id={gId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2208"/>
            <stop offset="45%" stopColor="#1a4414"/>
            <stop offset="100%" stopColor="#286020"/>
          </linearGradient>
        </defs>
        <path
          d={`M 50 0 C ${50+curveDir*12} 120 ${50-curveDir*15} 255 ${50+curveDir*9} 385 C ${50-curveDir*11} 495 ${50+curveDir*6} 548 50 580`}
          stroke={`url(#${gId})`} strokeWidth="5" strokeLinecap="round"
        />
        <path
          d={`M 50 0 C ${50+curveDir*12} 120 ${50-curveDir*15} 255 ${50+curveDir*9} 385 C ${50-curveDir*11} 495 ${50+curveDir*6} 548 50 580`}
          stroke="rgba(70,150,35,0.28)" strokeWidth="2" strokeLinecap="round"
        />
        {[60, 148, 235, 320, 405, 490, 555].map((y, idx) => {
          const side = idx % 2 === 0 ? 1 : -1
          const lx = 50 + side * 28
          const ang = side * (26 + idx * 3)
          const lw = Math.max(13, 21 - idx * 0.5)
          const lh = Math.max(6.5, 10.5 - idx * 0.25)
          const fills = ['#55b44a', '#47a23c', '#3a9030', '#2c7c25']
          return (
            <g key={y} transform={`translate(${lx},${y}) rotate(${ang})`}>
              <ellipse cx="0" cy="0" rx={lw} ry={lh} fill={fills[idx%4]}/>
              <ellipse cx="0" cy="0" rx={lw} ry={lh} fill="none" stroke="#194a11" strokeWidth="0.6"/>
              <line x1={-(lw-2)} y1="0" x2={lw-2} y2="0" stroke="#1e5a16" strokeWidth="0.75"/>
              <ellipse cx={lw*0.3} cy={-lh*0.25} rx={lw*0.28} ry={lh*0.28} fill="rgba(120,225,65,0.17)"/>
            </g>
          )
        })}
        {[108, 260, 400, 535].map((y, idx) => {
          const side = idx % 2 === 0 ? -1 : 1
          return (
            <path key={y} d={`M 50 ${y} C ${50+side*17} ${y+17} ${50+side*27} ${y+31} ${50+side*21} ${y+47}`}
              stroke="#286020" strokeWidth="1.7" strokeLinecap="round"/>
          )
        })}
      </svg>
    </motion.div>
  )
}

function BackgroundVines() {
  return (
    <>
      <SideVine x={-22} fromRight={false} dur={3.9} delay={0}   curveDir={1}/>
      <SideVine x={68}  fromRight={false} dur={4.6} delay={0.7} curveDir={-1}/>
      <SideVine x={-22} fromRight={true}  dur={4.3} delay={0.4} curveDir={-1}/>
      <SideVine x={68}  fromRight={true}  dur={3.6} delay={1.1} curveDir={1}/>
    </>
  )
}

// ── Light Rays ────────────────────────────────────────────────────────────────
function LightRays() {
  const rays = [
    { left: '22%', rotate: -14, op: 0.08, dur: 4.8, delay: 0 },
    { left: '42%', rotate: -4,  op: 0.13, dur: 5.4, delay: 0.8 },
    { left: '60%', rotate: 5,   op: 0.10, dur: 4.6, delay: 0.4 },
    { left: '78%', rotate: 14,  op: 0.07, dur: 5.1, delay: 1.2 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
      {rays.map((r, i) => (
        <motion.div
          key={i}
          animate={{ opacity: [r.op * 0.5, r.op, r.op * 0.5] }}
          transition={{ duration: r.dur, delay: r.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, left: r.left, width: 50, height: '80vh',
            background: `linear-gradient(180deg, rgba(160,210,80,${r.op*2.2}) 0%, rgba(190,150,50,${r.op}) 35%, transparent 100%)`,
            transform: `rotate(${r.rotate}deg)`, transformOrigin: 'top center', willChange: 'opacity',
          }}
        />
      ))}
    </div>
  )
}

// ── Fireflies ─────────────────────────────────────────────────────────────────
function Fireflies() {
  const rng = seededRng(99)
  const flies = Array.from({ length: 20 }, (_, i) => ({
    id: i, x: rng() * 100, startY: 20 + rng() * 70,
    driftX: (rng() - 0.5) * 50, dur: 5 + rng() * 5, delay: rng() * 7,
    size: 1.8 + rng() * 2.8, isGreen: rng() > 0.45,
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', overflow: 'hidden' }}>
      {flies.map(f => (
        <motion.div
          key={f.id}
          animate={{ y: ['0vh', '-75vh'], x: [0, f.driftX], opacity: [0, 0.9, 0.7, 0] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: `${f.x}%`, top: `${f.startY}%`,
            width: f.size, height: f.size, borderRadius: '50%',
            background: f.isGreen ? 'rgba(55,215,40,0.92)' : 'rgba(255,165,30,0.85)',
            boxShadow: f.isGreen ? '0 0 5px rgba(55,215,40,0.7)' : '0 0 4px rgba(255,165,30,0.6)',
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}

// ── Panel Vine Wrap ───────────────────────────────────────────────────────────
function PanelVineWrap() {
  return (
    <div style={{ position: 'absolute', inset: -18, pointerEvents: 'none', zIndex: 20, overflow: 'visible' }}>
      <svg viewBox="0 0 456 640" width="100%" height="100%" fill="none" overflow="visible">
        {/* Top-left corner vine */}
        <path d="M 0 120 C 18 88 42 64 72 48 C 102 32 138 30 162 18" stroke="#1e4a14" strokeWidth="4" strokeLinecap="round"/>
        <path d="M 0 120 C 20 90 48 68 80 54" stroke="#2a6a1e" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
        {[{ x: 72, y: 48, angle: -35 }, { x: 120, y: 30, angle: -20 }, { x: 162, y: 18, angle: -10 }].map((l, i) => (
          <g key={i} transform={`translate(${l.x},${l.y}) rotate(${l.angle})`}>
            <ellipse cx="0" cy="0" rx={18-i*2} ry={9-i} fill={i%2===0?'#4aa83a':'#3a9830'}/>
            <line x1={-(16-i*2)} y1="0" x2={16-i*2} y2="0" stroke="#1e5814" strokeWidth="0.7"/>
          </g>
        ))}
        {/* Top-left tendril drooping down left side */}
        <motion.path
          d="M 0 60 C 8 100 4 145 10 190 C 16 235 8 270 12 310"
          stroke="#1e4a14" strokeWidth="3" strokeLinecap="round"
          animate={{ rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '0px 60px' }}
        />
        {[95, 175, 255].map((y, i) => (
          <g key={y} transform={`translate(${i%2===0?22:8}, ${y}) rotate(${i%2===0?-40:40})`}>
            <ellipse cx="0" cy="0" rx="14" ry="7" fill={i%2===0?'#3a9030':'#4aa83a'}/>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#1e5814" strokeWidth="0.6"/>
          </g>
        ))}

        {/* Top-right corner vine */}
        <path d="M 456 120 C 438 88 414 64 384 48 C 354 32 318 30 294 18" stroke="#1e4a14" strokeWidth="4" strokeLinecap="round"/>
        <path d="M 456 120 C 436 90 408 68 376 54" stroke="#2a6a1e" strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
        {[{ x: 384, y: 48, angle: 35 }, { x: 336, y: 30, angle: 20 }, { x: 294, y: 18, angle: 10 }].map((l, i) => (
          <g key={i} transform={`translate(${l.x},${l.y}) rotate(${l.angle})`}>
            <ellipse cx="0" cy="0" rx={18-i*2} ry={9-i} fill={i%2===0?'#4aa83a':'#3a9830'}/>
            <line x1={-(16-i*2)} y1="0" x2={16-i*2} y2="0" stroke="#1e5814" strokeWidth="0.7"/>
          </g>
        ))}
        {/* Top-right side tendril */}
        <motion.path
          d="M 456 60 C 448 100 452 145 446 190 C 440 235 448 270 444 310"
          stroke="#1e4a14" strokeWidth="3" strokeLinecap="round"
          animate={{ rotate: [1.5, -1.5, 1.5] }}
          transition={{ duration: 4.3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transformOrigin: '456px 60px' }}
        />
        {[95, 175, 255].map((y, i) => (
          <g key={y} transform={`translate(${i%2===0?434:448}, ${y}) rotate(${i%2===0?40:-40})`}>
            <ellipse cx="0" cy="0" rx="14" ry="7" fill={i%2===0?'#3a9030':'#4aa83a'}/>
            <line x1="-12" y1="0" x2="12" y2="0" stroke="#1e5814" strokeWidth="0.6"/>
          </g>
        ))}

        {/* Top centre small drapes */}
        <path d="M 160 0 C 158 22 162 44 158 65" stroke="#256a18" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M 228 0 C 226 28 232 55 228 78" stroke="#1e4a14" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 296 0 C 298 22 294 44 298 65" stroke="#256a18" strokeWidth="2.5" strokeLinecap="round"/>
        {[{ x: 155, y: 40 }, { x: 228, y: 50 }, { x: 302, y: 40 }].map((l, i) => (
          <g key={i} transform={`translate(${l.x},${l.y}) rotate(${i%2===0?-30:30})`}>
            <ellipse cx="0" cy="0" rx="12" ry="6" fill="#47a23c"/>
          </g>
        ))}

        {/* Bottom-left root tendrils */}
        <path d="M 0 520 C 30 540 65 548 100 552 C 140 556 180 552 220 558" stroke="#160e06" strokeWidth="8" strokeLinecap="round"/>
        <path d="M 0 540 C 40 556 80 562 125 564" stroke="#120c04" strokeWidth="5" strokeLinecap="round"/>
        <path d="M 18 560 C 50 570 90 574 130 576" stroke="#1a1006" strokeWidth="3.5" strokeLinecap="round"/>
        {/* Bottom-right root tendrils */}
        <path d="M 456 520 C 426 540 391 548 356 552 C 316 556 276 552 236 558" stroke="#160e06" strokeWidth="8" strokeLinecap="round"/>
        <path d="M 456 540 C 416 556 376 562 331 564" stroke="#120c04" strokeWidth="5" strokeLinecap="round"/>
        <path d="M 438 560 C 406 570 366 574 326 576" stroke="#1a1006" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
function JungleInput({ label, type, value, onChange, placeholder, disabled }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ width: '100%', marginBottom: 13 }}>
      <label style={{
        display: 'block',
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: 9, letterSpacing: '2.8px',
        color: focused ? 'rgba(70,200,35,0.85)' : 'rgba(70,200,35,0.45)',
        marginBottom: 5, transition: 'color 0.2s', textTransform: 'uppercase',
      }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '11px 14px', fontSize: 15,
          fontFamily: '"Crimson Text", serif',
          background: focused ? 'rgba(30,60,15,0.35)' : 'rgba(5,12,4,0.65)',
          border: focused ? '1px solid rgba(70,200,35,0.55)' : '1px solid rgba(50,130,20,0.22)',
          borderRadius: 9, color: '#b8e890',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.12) 20px, rgba(0,0,0,0.12) 21px)',
          outline: 'none', boxSizing: 'border-box',
          boxShadow: focused
            ? 'inset 0 2px 6px rgba(0,0,0,0.55), 0 0 0 3px rgba(50,180,20,0.08)'
            : 'inset 0 2px 6px rgba(0,0,0,0.5)',
          transition: 'all 0.2s', caretColor: '#50d030',
          opacity: disabled ? 0.45 : 1,
        }}
      />
    </div>
  )
}

// ── Primary Button ────────────────────────────────────────────────────────────
function JungleButton({ children, onClick, disabled }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { y: -3, boxShadow: '0 10px 0 rgba(15,45,5,0.8), 0 14px 28px rgba(0,0,0,0.6), 0 0 20px rgba(60,200,20,0.18)' }}
      whileTap={disabled ? {} : { y: 3, boxShadow: '0 3px 0 rgba(15,45,5,0.8)' }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', height: 54, borderRadius: 11, border: 'none', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Cinzel Decorative", cursive', fontSize: 13, fontWeight: 900,
        letterSpacing: '2.5px', textTransform: 'uppercase', color: '#0a1e04',
        background: 'linear-gradient(180deg, #c8ff80 0%, #90d030 12%, #68aa18 38%, #488008 70%, #2e5505 100%)',
        boxShadow: '0 7px 0 rgba(15,45,5,0.8), 0 10px 24px rgba(0,0,0,0.5), 0 0 18px rgba(60,200,20,0.12)',
        opacity: disabled ? 0.45 : 1, marginBottom: 10, transition: 'opacity 0.2s',
      }}
    >
      {children}
    </motion.button>
  )
}

// ── Google Button ─────────────────────────────────────────────────────────────
function GoogleButton({ children, onClick, disabled }) {
  return (
    <motion.button
      whileHover={disabled ? {} : { y: -2, boxShadow: '0 8px 0 rgba(4,10,3,0.85), 0 12px 22px rgba(0,0,0,0.55)' }}
      whileTap={disabled ? {} : { y: 2, boxShadow: '0 2px 0 rgba(4,10,3,0.85)' }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%', height: 50, borderRadius: 11,
        border: '1px solid rgba(55,150,20,0.22)', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Cinzel Decorative", cursive', fontSize: 12, fontWeight: 900,
        letterSpacing: '1.5px', textTransform: 'uppercase', color: 'rgba(90,200,45,0.75)',
        background: 'linear-gradient(180deg, #0e1c0a 0%, #0a1408 50%, #070e05 100%)',
        boxShadow: '0 6px 0 rgba(4,10,3,0.85), 0 8px 20px rgba(0,0,0,0.45)',
        opacity: disabled ? 0.45 : 1, transition: 'opacity 0.2s',
      }}
    >
      {children}
    </motion.button>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function JungleDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 12px' }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(55,160,20,0.3))' }} />
      <span style={{ fontFamily: '"Cinzel Decorative", cursive', fontSize: 9, letterSpacing: '4px', color: 'rgba(55,160,20,0.4)', margin: '0 14px' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(55,160,20,0.3), transparent)' }} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function LoginScreen() {
  const [mode, setMode]               = useState('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [loading, setLoading]         = useState(false)

  const isSignUp = mode === 'signup'
  const clearError = () => setError('')

  const friendlyError = (code) => {
    switch (code) {
      case 'auth/invalid-email':          return 'That email address looks invalid.'
      case 'auth/user-not-found':         return 'No account found with that email.'
      case 'auth/wrong-password':         return 'Incorrect password. Try again.'
      case 'auth/email-already-in-use':   return 'An account with that email already exists.'
      case 'auth/weak-password':          return 'Password must be at least 6 characters.'
      case 'auth/popup-closed-by-user':   return 'Google sign-in was cancelled.'
      case 'auth/network-request-failed': return 'Network error. Check your connection.'
      case 'auth/too-many-requests':      return 'Too many attempts. Please wait a moment.'
      case 'auth/invalid-credential':     return 'Invalid email or password.'
      default:                            return 'Something went wrong. Please try again.'
    }
  }

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    if (isSignUp && !displayName.trim())   { setError('Please enter a display name.'); return }
    setLoading(true); clearError()
    try {
      if (isSignUp) {
        const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
        await updateProfile(user, { displayName: displayName.trim() })
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true); clearError()
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(''); setDisplayName(''); setEmail(''); setPassword('')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #040904 0%, #070e06 35%, #0a1608 60%, #040904 100%)' }}>
      <style>{`
        ::placeholder { color: rgba(80,160,40,0.35) !important; }
      `}</style>

      {/* Stone tile base */}
      <StoneTileGrid />

      {/* Deep jungle overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 50% 40%, transparent 12%, rgba(4,9,4,0.6) 78%),
          linear-gradient(180deg, rgba(4,9,4,0.8) 0%, rgba(4,9,4,0.1) 45%, rgba(4,9,4,0.4) 80%, rgba(4,9,4,0.85) 100%)
        `,
      }} />

      <LightRays />
      <BackgroundVines />
      <JungleCanopy />
      <GroundRoots />
      <Fireflies />

      {/* Scroll container */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 16px 30px',
        overflowY: 'auto',
      }}>
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.1 }}
          style={{
            position: 'relative',
            width: '100%', maxWidth: 420,
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.18) 28px, rgba(0,0,0,0.18) 29px),
              linear-gradient(160deg, rgba(10,20,8,0.97) 0%, rgba(6,14,4,0.99) 100%)
            `,
            borderRadius: 20,
            border: '1px solid rgba(50,140,20,0.3)',
            boxShadow: `
              0 0 0 1px rgba(40,120,15,0.06),
              0 28px 70px rgba(0,0,0,0.9),
              0 0 40px rgba(20,80,5,0.15),
              inset 0 1px 0 rgba(60,180,25,0.1)
            `,
            padding: '32px 28px 26px',
          }}
        >
          {/* Green shimmer top line */}
          <div style={{
            position: 'absolute', top: 0, left: '14%', right: '14%', height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(60,180,25,0.6), transparent)',
          }} />

          {/* Corner accents – jade green */}
          {[
            { top: 0,    left: 0    }, { top: 0,    right: 0   },
            { bottom: 0, left: 0    }, { bottom: 0, right: 0   },
          ].map((pos, i) => {
            const bwMap = ['2px 0 0 2px','2px 2px 0 0','0 0 2px 2px','0 2px 2px 0']
            return (
              <div key={i} style={{
                position: 'absolute', width: 18, height: 18, ...pos,
                borderColor: 'rgba(55,170,20,0.4)', borderStyle: 'solid', borderWidth: bwMap[i],
              }} />
            )
          })}

          {/* Vine wrap SVG */}
          <PanelVineWrap />

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: 18, position: 'relative', zIndex: 1 }}>
            {/* Tiki idol with jade eyes */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ display: 'inline-block', marginBottom: 6 }}
            >
              <svg viewBox="0 0 80 100" width="52" height="65">
                <ellipse cx="40" cy="54" rx="30" ry="38" fill="#1a2e14"/>
                <ellipse cx="40" cy="54" rx="27" ry="35" fill="#243d1c"/>
                <path d="M14 38 Q40 34 66 38" stroke="#2e5222" strokeWidth="3" fill="none"/>
                <path d="M14 54 Q40 50 66 54" stroke="#2e5222" strokeWidth="2" fill="none"/>
                <path d="M16 70 Q40 66 64 70" stroke="#2e5222" strokeWidth="2" fill="none"/>
                <path d="M18 32 Q40 26 62 32" stroke="#48a030" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6"/>
                <ellipse cx="27" cy="46" rx="8" ry="7" fill="#0a1408"/>
                <ellipse cx="53" cy="46" rx="8" ry="7" fill="#0a1408"/>
                <circle cx="27" cy="46" r="5" fill="#38d020" opacity="0.9"/>
                <circle cx="53" cy="46" r="5" fill="#38d020" opacity="0.9"/>
                <circle cx="28" cy="45" r="2" fill="#050a03"/>
                <circle cx="54" cy="45" r="2" fill="#050a03"/>
                <circle cx="26.5" cy="44.5" r="1" fill="rgba(200,255,180,0.7)"/>
                <circle cx="52.5" cy="44.5" r="1" fill="rgba(200,255,180,0.7)"/>
                <path d="M36 54 L40 58 L44 54" stroke="#2e5222" strokeWidth="2" fill="#1a2e14" strokeLinejoin="round"/>
                <rect x="26" y="62" width="28" height="7" rx="3" fill="#0a1408"/>
                <rect x="30" y="62" width="5" height="5" rx="1" fill="#a8c880"/>
                <rect x="37.5" y="62" width="5" height="5" rx="1" fill="#a8c880"/>
                <rect x="45" y="62" width="5" height="5" rx="1" fill="#a8c880"/>
                <polygon points="28,18 31,4 34,18"  fill="#48a030" opacity="0.9"/>
                <polygon points="38,16 40,0 42,16"  fill="#5cc040"/>
                <polygon points="46,18 49,4 52,18"  fill="#48a030" opacity="0.9"/>
                <rect x="22" y="16" width="36" height="8" rx="3" fill="#48a030" opacity="0.85"/>
                <circle cx="40" cy="22" r="4" fill="#c8ffb0"/>
                <circle cx="40" cy="22" r="2.5" fill="#5cc040"/>
                <ellipse cx="40" cy="90" rx="20" ry="5" fill="#38d020" opacity="0.12"/>
              </svg>
            </motion.div>

            <motion.h1
              animate={{ textShadow: [
                '0 0 18px rgba(55,200,20,0.35), 2px 2px 0 rgba(0,0,0,0.9)',
                '0 0 36px rgba(55,200,20,0.65), 2px 2px 0 rgba(0,0,0,0.9)',
                '0 0 18px rgba(55,200,20,0.35), 2px 2px 0 rgba(0,0,0,0.9)',
              ]}}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 'clamp(1.9rem, 6vw, 2.4rem)', fontWeight: 900,
                color: '#78d840', letterSpacing: '0.08em',
                margin: '4px 0 3px', lineHeight: 1,
              }}
            >
              TIKI<br/>TOPPLE
            </motion.h1>

            <AnimatePresence mode="wait">
              <motion.p
                key={mode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{
                  fontFamily: '"Crimson Text", serif', fontStyle: 'italic',
                  fontSize: '0.87rem', color: 'rgba(80,200,35,0.5)',
                  margin: 0, letterSpacing: '2px',
                }}
              >
                {isSignUp ? '— Forge your legend —' : '— Enter the temple —'}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Green rune divider line */}
          <div style={{
            height: 1, marginBottom: 18,
            background: 'linear-gradient(90deg, transparent, rgba(55,170,20,0.4), transparent)',
          }} />

          {/* Form */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: isSignUp ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignUp ? -16 : 16 }}
                transition={{ duration: 0.22 }}
              >
                {isSignUp && (
                  <JungleInput label="Display Name" type="text" value={displayName}
                    onChange={e => setDisplayName(e.target.value)} placeholder="Chief Tama" disabled={loading}/>
                )}
                <JungleInput label="Email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@temple.run" disabled={loading}/>
                <JungleInput label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" disabled={loading}/>
              </motion.div>
            </AnimatePresence>

            {/* Error toast */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  style={{
                    background: 'rgba(120,15,15,0.2)', border: '1px solid rgba(200,50,50,0.3)',
                    borderRadius: 9, padding: '10px 14px', marginBottom: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: '#f09090', fontFamily: '"Crimson Text", serif' }}>{error}</span>
                  <span onClick={clearError} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && clearError()}
                    style={{ cursor: 'pointer', color: 'rgba(255,120,120,0.65)', fontWeight: 'bold', fontSize: 15 }}>✕</span>
                </motion.div>
              )}
            </AnimatePresence>

            <JungleButton onClick={handleEmailAuth} disabled={loading}>
              {loading ? '⏳ Please wait…' : isSignUp ? '⚡ Create Account' : '⚡ Enter the Trial'}
            </JungleButton>

            <JungleDivider />

            <GoogleButton onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Continue with Google
            </GoogleButton>

            {/* Mode toggle */}
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <span style={{ fontFamily: '"Crimson Text", serif', fontSize: 13, color: 'rgba(70,180,30,0.45)' }}>
                {isSignUp ? 'Already initiated? ' : 'New to the temple? '}
              </span>
              <motion.button
                whileHover={{ color: '#78d840' }}
                onClick={toggleMode} disabled={loading}
                style={{
                  background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: '"Cinzel Decorative", cursive', fontSize: 10,
                  color: 'rgba(70,200,30,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase',
                  textDecoration: 'underline', textDecorationColor: 'rgba(55,160,20,0.3)',
                  padding: 0, transition: 'color 0.2s',
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </motion.button>
            </div>

            <p style={{
              textAlign: 'center', marginTop: 16, marginBottom: 0,
              fontFamily: '"Cinzel Decorative", cursive', fontSize: 8,
              letterSpacing: '3px', color: 'rgba(55,160,20,0.22)',
            }}>
              ✦ 2 – 4 PLAYERS · TURN-BASED ✦
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
