// ── Premium Colorful Tiki Mask Avatars ────────────────────────────────────────
// Each avatar: { id, name, svg }  — SVG is self-contained, viewBox="0 0 100 100"

export const AVATARS = [
  {
    id: 'surfer',
    name: 'Kai',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="kai-grad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#D94A1A"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="55" rx="32" ry="38" fill="url(#kai-grad1)"/>
  <path d="M30 20 L35 10 L40 20 L45 8 L50 20 L55 8 L60 20 L65 10 L70 20 L50 25Z" fill="#00BCD4"/>
  <path d="M32 20 L37 12 L42 20 L47 10 L50 22 L53 10 L58 20 L63 12 L68 20 L50 24Z" fill="#0097A7"/>
  <ellipse cx="38" cy="45" rx="10" ry="14" fill="white"/>
  <ellipse cx="62" cy="45" rx="10" ry="14" fill="white"/>
  <ellipse cx="38" cy="46" rx="7" ry="10" fill="#1A237E"/>
  <ellipse cx="62" cy="46" rx="7" ry="10" fill="#1A237E"/>
  <ellipse cx="38" cy="44" rx="4" ry="6" fill="black"/>
  <ellipse cx="62" cy="44" rx="4" ry="6" fill="black"/>
  <path d="M45 55 L50 62 L55 55 L50 58Z" fill="#C62828"/>
  <path d="M32 70 Q50 82 68 70 L68 75 Q50 87 32 75Z" fill="#1A237E"/>
  <rect x="35" y="70" width="5" height="8" fill="white"/>
  <rect x="42" y="70" width="5" height="8" fill="white"/>
  <rect x="53" y="70" width="5" height="8" fill="white"/>
  <rect x="60" y="70" width="5" height="8" fill="white"/>
  <circle cx="28" cy="40" r="4" fill="#FFD700"/>
  <circle cx="72" cy="40" r="4" fill="#FFD700"/>
  <path d="M25 55 L30 50 L25 60Z" fill="#00BCD4"/>
  <path d="M75 55 L70 50 L75 60Z" fill="#00BCD4"/>
</svg>`,
  },
  {
    id: 'chieftain',
    name: 'Maka',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="maka-grad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8BC34A"/>
      <stop offset="100%" stop-color="#558B2F"/>
    </linearGradient>
  </defs>
  <rect x="22" y="25" width="56" height="65" rx="8" fill="url(#maka-grad1)"/>
  <path d="M25 25 L30 10 L35 25 L40 8 L45 25 L50 5 L55 25 L60 8 L65 25 L70 10 L75 25Z" fill="#FF5722"/>
  <path d="M27 25 L32 12 L37 25 L42 10 L47 25 L50 7 L53 25 L58 10 L63 25 L68 12 L73 25Z" fill="#FFD600"/>
  <ellipse cx="37" cy="48" rx="11" ry="13" fill="#00BCD4"/>
  <ellipse cx="63" cy="48" rx="11" ry="13" fill="#00BCD4"/>
  <ellipse cx="37" cy="49" rx="8" ry="10" fill="white"/>
  <ellipse cx="63" cy="49" rx="8" ry="10" fill="white"/>
  <circle cx="37" cy="48" r="5" fill="black"/>
  <circle cx="63" cy="48" r="5" fill="black"/>
  <path d="M44 58 L50 68 L56 58Z" fill="#FF5722"/>
  <path d="M30 75 Q50 88 70 75 L68 80 Q50 92 32 80Z" fill="#C62828"/>
  <ellipse cx="50" cy="85" rx="8" ry="10" fill="#FF5252"/>
  <path d="M25 35 L28 38 L25 41 L28 44 L25 47" stroke="#FFD600" stroke-width="3" fill="none"/>
  <path d="M75 35 L72 38 L75 41 L72 44 L75 47" stroke="#FFD600" stroke-width="3" fill="none"/>
  <rect x="30" y="82" width="8" height="6" fill="#00BCD4"/>
  <rect x="42" y="82" width="8" height="6" fill="#FFD600"/>
  <rect x="50" y="82" width="8" height="6" fill="#00BCD4"/>
  <rect x="62" y="82" width="8" height="6" fill="#FFD600"/>
</svg>`,
  },
  {
    id: 'volcano',
    name: 'Pele',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pele-grad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF6B35"/>
      <stop offset="100%" stop-color="#F44336"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="55" rx="30" ry="40" fill="url(#pele-grad1)"/>
  <path d="M28 22 Q32 8 36 22 Q40 5 44 22 Q48 10 50 22 Q52 10 56 22 Q60 5 64 22 Q68 8 72 22 L50 28Z" fill="#FFD600"/>
  <path d="M30 22 Q34 10 38 22 Q42 8 46 22 Q48 12 50 24 Q52 12 54 22 Q58 8 62 22 Q66 10 70 22 L50 27Z" fill="#FF9800"/>
  <ellipse cx="36" cy="45" rx="12" ry="10" fill="white" transform="rotate(-15 36 45)"/>
  <ellipse cx="64" cy="45" rx="12" ry="10" fill="white" transform="rotate(15 64 45)"/>
  <ellipse cx="36" cy="46" rx="8" ry="7" fill="#FFD600"/>
  <ellipse cx="64" cy="46" rx="8" ry="7" fill="#FFD600"/>
  <circle cx="36" cy="45" r="4" fill="black"/>
  <circle cx="64" cy="45" r="4" fill="black"/>
  <path d="M26 38 L42 42" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/>
  <path d="M74 38 L58 42" stroke="#8B4513" stroke-width="3" stroke-linecap="round"/>
  <rect x="46" y="55" width="8" height="12" rx="2" fill="#D84315"/>
  <path d="M30 72 Q50 88 70 72 L68 78 Q50 92 32 78Z" fill="#1A237E"/>
  <rect x="33" y="72" width="6" height="10" fill="white"/>
  <rect x="41" y="72" width="6" height="10" fill="white"/>
  <rect x="53" y="72" width="6" height="10" fill="white"/>
  <rect x="61" y="72" width="6" height="10" fill="white"/>
  <circle cx="24" cy="55" r="5" fill="#FFD600"/>
  <circle cx="76" cy="55" r="5" fill="#FFD600"/>
  <path d="M22 65 L26 60 L22 70" fill="#00BCD4"/>
  <path d="M78 65 L74 60 L78 70" fill="#00BCD4"/>
</svg>`,
  },
  {
    id: 'mermaid',
    name: 'Moana',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="moana-grad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#9C27B0"/>
      <stop offset="100%" stop-color="#6A1B9A"/>
    </linearGradient>
  </defs>
  <rect x="24" y="28" width="52" height="62" rx="10" fill="url(#moana-grad1)"/>
  <path d="M26 28 L32 12 L38 28 L44 10 L50 28 L56 10 L62 28 L68 12 L74 28Z" fill="#FF4081"/>
  <circle cx="32" cy="12" r="4" fill="#00BCD4"/>
  <circle cx="44" cy="10" r="4" fill="#FFD600"/>
  <circle cx="50" cy="28" r="4" fill="#00BCD4"/>
  <circle cx="56" cy="10" r="4" fill="#FFD600"/>
  <circle cx="68" cy="12" r="4" fill="#00BCD4"/>
  <ellipse cx="38" cy="50" rx="10" ry="12" fill="#00BCD4"/>
  <ellipse cx="62" cy="50" rx="10" ry="12" fill="#00BCD4"/>
  <ellipse cx="38" cy="51" rx="7" ry="9" fill="white"/>
  <ellipse cx="62" cy="51" rx="7" ry="9" fill="white"/>
  <circle cx="38" cy="50" r="4" fill="black"/>
  <circle cx="62" cy="50" r="4" fill="black"/>
  <circle cx="39" cy="48" r="2" fill="white" opacity="0.8"/>
  <circle cx="63" cy="48" r="2" fill="white" opacity="0.8"/>
  <path d="M46 60 L50 68 L54 60Z" fill="#7B1FA2"/>
  <path d="M35 75 Q50 82 65 75" stroke="#1A237E" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M35 75 Q50 80 65 75 L65 78 Q50 85 35 78Z" fill="#FF4081"/>
  <path d="M26 45 Q22 50 26 55" stroke="#00BCD4" stroke-width="2" fill="none"/>
  <path d="M74 45 Q78 50 74 55" stroke="#00BCD4" stroke-width="2" fill="none"/>
  <rect x="28" y="82" width="44" height="6" fill="#FF4081"/>
  <circle cx="32" cy="85" r="2" fill="#FFD600"/>
  <circle cx="42" cy="85" r="2" fill="#00BCD4"/>
  <circle cx="50" cy="85" r="2" fill="#FFD600"/>
  <circle cx="58" cy="85" r="2" fill="#00BCD4"/>
  <circle cx="68" cy="85" r="2" fill="#FFD600"/>
</svg>`,
  },
  {
    id: 'shaman',
    name: 'Tama',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tama-grad1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF9800"/>
      <stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
  </defs>
  <ellipse cx="50" cy="58" rx="32" ry="38" fill="url(#tama-grad1)"/>
  <ellipse cx="30" cy="18" rx="6" ry="20" fill="#00BCD4" transform="rotate(-25 30 18)"/>
  <ellipse cx="38" cy="12" rx="6" ry="22" fill="#8BC34A" transform="rotate(-12 38 12)"/>
  <ellipse cx="46" cy="10" rx="6" ry="24" fill="#FF5722" transform="rotate(-5 46 10)"/>
  <ellipse cx="50" cy="8" rx="6" ry="26" fill="#FFD600"/>
  <ellipse cx="54" cy="10" rx="6" ry="24" fill="#FF5722" transform="rotate(5 54 10)"/>
  <ellipse cx="62" cy="12" rx="6" ry="22" fill="#8BC34A" transform="rotate(12 62 12)"/>
  <ellipse cx="70" cy="18" rx="6" ry="20" fill="#00BCD4" transform="rotate(25 70 18)"/>
  <ellipse cx="38" cy="48" rx="11" ry="13" fill="white"/>
  <ellipse cx="62" cy="48" rx="11" ry="13" fill="white"/>
  <ellipse cx="38" cy="49" rx="8" ry="10" fill="#8B4513"/>
  <ellipse cx="62" cy="49" rx="8" ry="10" fill="#8B4513"/>
  <circle cx="38" cy="48" r="4" fill="black"/>
  <circle cx="62" cy="48" r="4" fill="black"/>
  <circle cx="40" cy="46" r="2" fill="white" opacity="0.9"/>
  <circle cx="64" cy="46" r="2" fill="white" opacity="0.9"/>
  <rect x="44" y="58" width="12" height="10" rx="3" fill="#D84315"/>
  <path d="M32 75 Q50 80 68 75" stroke="#5D4037" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M26 42 L30 38 L26 52" fill="#00BCD4"/>
  <path d="M74 42 L70 38 L74 52" fill="#00BCD4"/>
  <circle cx="28" cy="60" r="4" fill="#FFD600"/>
  <circle cx="72" cy="60" r="4" fill="#FFD600"/>
  <path d="M30 85 L35 80 L40 85 L45 80 L50 85 L55 80 L60 85 L65 80 L70 85" stroke="#00BCD4" stroke-width="3" fill="none"/>
</svg>`,
  },
]

// O(1) lookup by id
export const AVATAR_MAP = Object.fromEntries(AVATARS.map(a => [a.id, a]))
