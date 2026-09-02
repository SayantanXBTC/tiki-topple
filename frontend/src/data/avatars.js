// ── Premium Tiki Mask Avatars — Redesigned for max expressiveness ─────────────
// viewBox="0 0 100 100" — crown y:0–32, face y:26–96, eyes y:52–66, mouth y:78–88

export const AVATARS = [
  {
    id: 'surfer',
    name: 'Kai',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ka-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FF7043"/>
      <stop offset="100%" stop-color="#BF360C"/>
    </linearGradient>
    <radialGradient id="ka-hl" cx="38%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#FF8A65" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <!-- Wave crown -->
  <path d="M19 34 L23 16 L28 30 L34 8 L41 28 L47 2 L50 26 L53 2 L59 28 L66 8 L72 30 L77 16 L81 34 L50 40Z" fill="#00BCD4"/>
  <path d="M21 34 L25 18 L30 30 L36 10 L42 29 L48 4 L50 28 L52 4 L58 29 L64 10 L70 30 L75 18 L79 34 L50 39Z" fill="#00ACC1" opacity="0.55"/>
  <!-- Crown gems -->
  <circle cx="50" cy="2.5" r="3.2" fill="#FFD700"/>
  <ellipse cx="33.5" cy="8.5" rx="2.2" ry="2.2" fill="#FFF176"/>
  <ellipse cx="66.5" cy="8.5" rx="2.2" ry="2.2" fill="#FFF176"/>
  <!-- Face -->
  <ellipse cx="50" cy="63" rx="30" ry="34" fill="url(#ka-f)"/>
  <ellipse cx="50" cy="63" rx="30" ry="34" fill="url(#ka-hl)"/>
  <!-- Eye surround (carved sockets) -->
  <ellipse cx="37" cy="57" rx="12" ry="13.5" fill="rgba(0,0,0,0.22)"/>
  <ellipse cx="63" cy="57" rx="12" ry="13.5" fill="rgba(0,0,0,0.22)"/>
  <!-- Eye whites -->
  <ellipse cx="37" cy="57" rx="10.5" ry="12" fill="white"/>
  <ellipse cx="63" cy="57" rx="10.5" ry="12" fill="white"/>
  <!-- Iris — deep ocean blue -->
  <ellipse cx="37" cy="58" rx="7.5" ry="8.5" fill="#1565C0"/>
  <ellipse cx="63" cy="58" rx="7.5" ry="8.5" fill="#1565C0"/>
  <!-- Iris ring -->
  <ellipse cx="37" cy="58" rx="5.5" ry="6.5" fill="#1976D2"/>
  <ellipse cx="63" cy="58" rx="5.5" ry="6.5" fill="#1976D2"/>
  <!-- Pupils -->
  <ellipse cx="37" cy="58.5" rx="3.2" ry="4" fill="#060608"/>
  <ellipse cx="63" cy="58.5" rx="3.2" ry="4" fill="#060608"/>
  <!-- Primary shine -->
  <circle cx="34.2" cy="55" r="2.4" fill="white" opacity="0.95"/>
  <circle cx="60.2" cy="55" r="2.4" fill="white" opacity="0.95"/>
  <!-- Secondary shine -->
  <circle cx="38.5" cy="61" r="1.1" fill="rgba(255,255,255,0.45)"/>
  <circle cx="64.5" cy="61" r="1.1" fill="rgba(255,255,255,0.45)"/>
  <!-- Eyebrows — strong, inward tilt (determined) -->
  <path d="M26.5 45.5 Q37 40.5 47 45.5" stroke="#5D1A00" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M53 45.5 Q63 40.5 73.5 45.5" stroke="#5D1A00" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <path d="M46 69 L44 74.5 Q50 77.5 56 74.5 L54 69" fill="rgba(0,0,0,0.2)" stroke="#8D3200" stroke-width="1.2" stroke-linejoin="round"/>
  <!-- Mouth — big open grin -->
  <path d="M32 83 Q50 96 68 83" fill="#B71C1C"/>
  <path d="M35 83 Q50 92 65 83 L64 87.5 Q50 94 36 87.5Z" fill="white"/>
  <line x1="43.5" y1="83.5" x2="43.5" y2="88" stroke="#BDBDBD" stroke-width="0.9"/>
  <line x1="50"   y1="83.5" x2="50"   y2="89" stroke="#BDBDBD" stroke-width="0.9"/>
  <line x1="56.5" y1="83.5" x2="56.5" y2="88" stroke="#BDBDBD" stroke-width="0.9"/>
  <!-- Gold earrings -->
  <circle cx="20" cy="63" r="4.8" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/>
  <circle cx="80" cy="63" r="4.8" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/>
  <!-- Cheek wave tattoos -->
  <path d="M21 73 Q24.5 70 21 76.5 Q24.5 73 21 80" stroke="#00ACC1" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M79 73 Q75.5 70 79 76.5 Q75.5 73 79 80" stroke="#00ACC1" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <!-- Chin dot -->
  <circle cx="50" cy="94" r="2.2" fill="#00BCD4" opacity="0.7"/>
</svg>`,
  },
  {
    id: 'chieftain',
    name: 'Maka',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ma-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#66BB6A"/>
      <stop offset="100%" stop-color="#2E7D32"/>
    </linearGradient>
    <radialGradient id="ma-hl" cx="38%" cy="28%" r="52%">
      <stop offset="0%" stop-color="#A5D6A7" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <!-- Tall multi-spike crown -->
  <path d="M22 32 L25 8 L30 28 L36 4 L41 26 L47 0 L50 24 L53 0 L59 26 L64 4 L70 28 L75 8 L78 32Z" fill="#F44336"/>
  <path d="M24 32 L27 10 L32 28 L38 6 L43 27 L49 2 L50 26 L51 2 L57 27 L62 6 L68 28 L73 10 L76 32Z" fill="#FF7043" opacity="0.5"/>
  <!-- Crown gold trim -->
  <rect x="22" y="30" width="56" height="5" rx="2.5" fill="#FFD600"/>
  <rect x="22" y="31" width="56" height="2" fill="#FFB300" opacity="0.6"/>
  <!-- Crown gems -->
  <circle cx="50" cy="1.5" r="3.5" fill="#FFD700"/>
  <circle cx="35.5" cy="4.5" r="2.2" fill="#FFF176"/>
  <circle cx="64.5" cy="4.5" r="2.2" fill="#FFF176"/>
  <!-- Face — broad rect -->
  <rect x="22" y="31" width="56" height="62" rx="9" fill="url(#ma-f)"/>
  <rect x="22" y="31" width="56" height="62" rx="9" fill="url(#ma-hl)"/>
  <!-- Eye sockets -->
  <ellipse cx="37" cy="56" rx="12" ry="12" fill="rgba(0,0,0,0.25)"/>
  <ellipse cx="63" cy="56" rx="12" ry="12" fill="rgba(0,0,0,0.25)"/>
  <!-- Eye whites -->
  <ellipse cx="37" cy="56" rx="10" ry="11" fill="white"/>
  <ellipse cx="63" cy="56" rx="10" ry="11" fill="white"/>
  <!-- Iris — fierce amber -->
  <ellipse cx="37" cy="57" rx="7" ry="7.8" fill="#FF8F00"/>
  <ellipse cx="63" cy="57" rx="7" ry="7.8" fill="#FF8F00"/>
  <ellipse cx="37" cy="57" rx="5" ry="5.8" fill="#FFA000"/>
  <ellipse cx="63" cy="57" rx="5" ry="5.8" fill="#FFA000"/>
  <!-- Pupils -->
  <ellipse cx="37" cy="57" rx="2.8" ry="3.8" fill="#080808"/>
  <ellipse cx="63" cy="57" rx="2.8" ry="3.8" fill="#080808"/>
  <!-- Eye shine -->
  <circle cx="34.2" cy="54" r="2.4" fill="white" opacity="0.95"/>
  <circle cx="60.2" cy="54" r="2.4" fill="white" opacity="0.95"/>
  <circle cx="38" cy="59.5" r="1" fill="rgba(255,255,255,0.42)"/>
  <circle cx="64" cy="59.5" r="1" fill="rgba(255,255,255,0.42)"/>
  <!-- Heavy furrowed brows -->
  <path d="M25.5 44 Q37 38 47.5 44" stroke="#1A4A1A" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M52.5 44 Q63 38 74.5 44" stroke="#1A4A1A" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Inner brow shadow -->
  <path d="M29 45.5 Q37 40 47 45.5" stroke="rgba(0,0,0,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M53 45.5 Q63 40 71 45.5" stroke="rgba(0,0,0,0.3)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Nose — broad tribal -->
  <path d="M44 68 L41 75 Q50 79 59 75 L56 68" fill="rgba(0,0,0,0.22)" stroke="#1A4A1A" stroke-width="1.3" stroke-linejoin="round"/>
  <!-- Stern mouth — tightly set grin -->
  <path d="M31 84 Q50 93 69 84" fill="#B71C1C"/>
  <path d="M34 84 Q50 90.5 66 84 L65 87 Q50 93 35 87Z" fill="white"/>
  <line x1="44" y1="84" x2="44" y2="87.5" stroke="#BDBDBD" stroke-width="1"/>
  <line x1="56" y1="84" x2="56" y2="87.5" stroke="#BDBDBD" stroke-width="1"/>
  <!-- Bone earrings -->
  <rect x="12" y="58" width="8" height="12" rx="4" fill="#F5F5DC" stroke="#8D6E63" stroke-width="1.2"/>
  <rect x="80" y="58" width="8" height="12" rx="4" fill="#F5F5DC" stroke="#8D6E63" stroke-width="1.2"/>
  <!-- Cheek geometric diamonds -->
  <path d="M25 70 L29 67 L33 70 L29 73Z" fill="#FFD600" opacity="0.8"/>
  <path d="M75 70 L71 67 L67 70 L71 73Z" fill="#FFD600" opacity="0.8"/>
  <!-- Forehead battle mark -->
  <path d="M42 36 L50 32 L58 36" stroke="#FFD600" stroke-width="1.8" fill="none" stroke-linecap="round"/>
</svg>`,
  },
  {
    id: 'volcano',
    name: 'Pele',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pe-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EF5350"/>
      <stop offset="100%" stop-color="#B71C1C"/>
    </linearGradient>
    <radialGradient id="pe-hl" cx="40%" cy="28%" r="55%">
      <stop offset="0%" stop-color="#FFCDD2" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <!-- Flame crown — tall layered -->
  <path d="M26 34 Q26 14 32 6 Q34 18 38 22 Q40 10 44 2 Q46 14 48 20 Q50 6 52 2 Q54 14 56 20 Q58 8 62 2 Q64 14 66 22 Q70 12 72 6 Q74 16 74 34Z" fill="#FFD600"/>
  <path d="M28 34 Q28 16 33 8 Q36 20 39 24 Q42 12 46 4 Q47 16 49 22 Q50 8 51 4 Q52 14 54 22 Q57 10 61 4 Q63 16 66 24 Q68 16 71 8 Q72 18 72 34Z" fill="#FF9800" opacity="0.72"/>
  <path d="M32 34 Q32 20 36 12 Q38 22 41 26 Q44 16 48 8 Q49 20 50 28 Q51 20 52 8 Q56 16 59 26 Q62 20 64 12 Q66 22 68 34Z" fill="#FF5722" opacity="0.45"/>
  <!-- Face oval -->
  <ellipse cx="50" cy="63" rx="29" ry="33" fill="url(#pe-f)"/>
  <ellipse cx="50" cy="63" rx="29" ry="33" fill="url(#pe-hl)"/>
  <!-- Lava cracks on face -->
  <path d="M30 55 Q34 58 30 62" stroke="#FF9800" stroke-width="1.2" fill="none" opacity="0.65"/>
  <path d="M70 55 Q66 58 70 62" stroke="#FF9800" stroke-width="1.2" fill="none" opacity="0.65"/>
  <!-- Eye sockets — angular, intense -->
  <ellipse cx="37" cy="56" rx="12.5" ry="12" fill="rgba(0,0,0,0.3)" transform="rotate(-8 37 56)"/>
  <ellipse cx="63" cy="56" rx="12.5" ry="12" fill="rgba(0,0,0,0.3)" transform="rotate(8 63 56)"/>
  <!-- Eye whites -->
  <ellipse cx="37" cy="56" rx="10.5" ry="10" fill="white" transform="rotate(-8 37 56)"/>
  <ellipse cx="63" cy="56" rx="10.5" ry="10" fill="white" transform="rotate(8 63 56)"/>
  <!-- Iris — molten golden -->
  <ellipse cx="37" cy="57" rx="7.5" ry="7" fill="#FF6F00"/>
  <ellipse cx="63" cy="57" rx="7.5" ry="7" fill="#FF6F00"/>
  <ellipse cx="37" cy="57" rx="5.5" ry="5" fill="#FFCA28"/>
  <ellipse cx="63" cy="57" rx="5.5" ry="5" fill="#FFCA28"/>
  <!-- Pupils -->
  <ellipse cx="37" cy="57" rx="3" ry="3.5" fill="#0A0602"/>
  <ellipse cx="63" cy="57" rx="3" ry="3.5" fill="#0A0602"/>
  <!-- Eye shine -->
  <circle cx="34" cy="53.5" r="2.5" fill="white" opacity="0.9"/>
  <circle cx="60" cy="53.5" r="2.5" fill="white" opacity="0.9"/>
  <circle cx="38.5" cy="59" r="1.1" fill="rgba(255,255,255,0.4)"/>
  <circle cx="64.5" cy="59" r="1.1" fill="rgba(255,255,255,0.4)"/>
  <!-- Arched fierce brows -->
  <path d="M25 44 Q37 37 48 43" stroke="#7B0000" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M52 43 Q63 37 75 44" stroke="#7B0000" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <!-- Nose — broad bridge -->
  <path d="M45 67 L43 73.5 Q50 77 57 73.5 L55 67" fill="rgba(0,0,0,0.25)" stroke="#7B0000" stroke-width="1.3" stroke-linejoin="round"/>
  <!-- Roaring mouth — wide open -->
  <path d="M30 82 Q50 97 70 82" fill="#7B0000"/>
  <path d="M32 82 Q50 94 68 82 L68 88 Q50 97 32 88Z" fill="#B71C1C"/>
  <!-- Top teeth row -->
  <path d="M34 82 Q50 88 66 82 L64 86 Q50 90 36 86Z" fill="white"/>
  <!-- Bottom teeth row -->
  <path d="M36 90 Q50 95 64 90 L63 93 Q50 96 37 93Z" fill="white"/>
  <line x1="43" y1="82.5" x2="43" y2="86.5" stroke="#E0E0E0" stroke-width="0.8"/>
  <line x1="50" y1="82.5" x2="50" y2="87"   stroke="#E0E0E0" stroke-width="0.8"/>
  <line x1="57" y1="82.5" x2="57" y2="86.5" stroke="#E0E0E0" stroke-width="0.8"/>
  <!-- Fire side-pieces instead of ears -->
  <path d="M20 50 Q14 56 16 64 Q18 68 21 64" fill="#FF9800" opacity="0.8"/>
  <path d="M80 50 Q86 56 84 64 Q82 68 79 64" fill="#FF9800" opacity="0.8"/>
</svg>`,
  },
  {
    id: 'mermaid',
    name: 'Moana',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="mo-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#AB47BC"/>
      <stop offset="100%" stop-color="#6A1B9A"/>
    </linearGradient>
    <radialGradient id="mo-hl" cx="40%" cy="30%" r="52%">
      <stop offset="0%" stop-color="#E1BEE7" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <!-- Coral-arch crown -->
  <path d="M26 32 Q22 22 26 14 Q30 8 35 14 Q37 8 42 6 Q45 12 44 18 Q48 8 50 4 Q52 8 56 18 Q55 12 58 6 Q63 8 65 14 Q70 22 74 14 Q78 8 74 32Z" fill="#F06292"/>
  <!-- Pearl dots on crown -->
  <circle cx="50" cy="4.5" r="3.5" fill="#E0F7FA"/>
  <circle cx="35.5" cy="14.5" r="2.5" fill="#E0F7FA"/>
  <circle cx="64.5" cy="14.5" r="2.5" fill="#E0F7FA"/>
  <circle cx="27" cy="24" r="2" fill="#B2EBF2"/>
  <circle cx="73" cy="24" r="2" fill="#B2EBF2"/>
  <!-- Crown shimmer strip -->
  <path d="M26 29 Q50 25 74 29" stroke="rgba(255,255,255,0.35)" stroke-width="1.5" fill="none"/>
  <!-- Face — rounded rect -->
  <rect x="23" y="28" width="54" height="63" rx="12" fill="url(#mo-f)"/>
  <rect x="23" y="28" width="54" height="63" rx="12" fill="url(#mo-hl)"/>
  <!-- Wave patterns on cheeks -->
  <path d="M25 60 Q29 57 33 60 Q29 63 25 66" stroke="#CE93D8" stroke-width="1.5" fill="none"/>
  <path d="M75 60 Q71 57 67 60 Q71 63 75 66" stroke="#CE93D8" stroke-width="1.5" fill="none"/>
  <!-- Eye sockets -->
  <ellipse cx="37" cy="55" rx="12" ry="13" fill="rgba(0,0,0,0.2)"/>
  <ellipse cx="63" cy="55" rx="12" ry="13" fill="rgba(0,0,0,0.2)"/>
  <!-- Eye whites — large, gentle almond -->
  <ellipse cx="37" cy="55" rx="10.5" ry="12" fill="white"/>
  <ellipse cx="63" cy="55" rx="10.5" ry="12" fill="white"/>
  <!-- Iris — aquamarine -->
  <ellipse cx="37" cy="56" rx="7.5" ry="8.8" fill="#00ACC1"/>
  <ellipse cx="63" cy="56" rx="7.5" ry="8.8" fill="#00ACC1"/>
  <ellipse cx="37" cy="56" rx="5.5" ry="6.5" fill="#00BCD4"/>
  <ellipse cx="63" cy="56" rx="5.5" ry="6.5" fill="#00BCD4"/>
  <!-- Pupils -->
  <ellipse cx="37" cy="56.5" rx="3.2" ry="4.2" fill="#040410"/>
  <ellipse cx="63" cy="56.5" rx="3.2" ry="4.2" fill="#040410"/>
  <!-- Eye shine -->
  <circle cx="34" cy="52.5" r="2.6" fill="white" opacity="0.95"/>
  <circle cx="60" cy="52.5" r="2.6" fill="white" opacity="0.95"/>
  <circle cx="38.5" cy="59" r="1.3" fill="rgba(255,255,255,0.45)"/>
  <circle cx="64.5" cy="59" r="1.3" fill="rgba(255,255,255,0.45)"/>
  <!-- Gentle arched brows -->
  <path d="M27 43 Q37 37.5 47 42" stroke="#4A148C" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <path d="M53 42 Q63 37.5 73 43" stroke="#4A148C" stroke-width="2.8" fill="none" stroke-linecap="round"/>
  <!-- Nose — delicate -->
  <path d="M47 67 L45 72 Q50 75 55 72 L53 67" fill="rgba(0,0,0,0.15)" stroke="#4A148C" stroke-width="1.1" stroke-linejoin="round"/>
  <!-- Soft smile -->
  <path d="M34 82 Q50 93 66 82" fill="#880E4F"/>
  <path d="M36 82 Q50 90 64 82 L63 85.5 Q50 92 37 85.5Z" fill="white"/>
  <line x1="44" y1="82.5" x2="44" y2="86" stroke="#E0E0E0" stroke-width="0.8"/>
  <line x1="56" y1="82.5" x2="56" y2="86" stroke="#E0E0E0" stroke-width="0.8"/>
  <!-- Pearl drop earrings -->
  <circle cx="18" cy="58" r="4.2" fill="#E0F7FA" stroke="#80DEEA" stroke-width="1.3"/>
  <circle cx="18" cy="65" r="3.2" fill="#B2EBF2" stroke="#80DEEA" stroke-width="1"/>
  <circle cx="82" cy="58" r="4.2" fill="#E0F7FA" stroke="#80DEEA" stroke-width="1.3"/>
  <circle cx="82" cy="65" r="3.2" fill="#B2EBF2" stroke="#80DEEA" stroke-width="1"/>
  <!-- Forehead gem -->
  <ellipse cx="50" cy="32" rx="3.5" ry="4" fill="#80DEEA"/>
  <ellipse cx="50" cy="32" rx="2" ry="2.2" fill="white" opacity="0.6"/>
</svg>`,
  },
  {
    id: 'shaman',
    name: 'Tama',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ta-f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFA726"/>
      <stop offset="100%" stop-color="#E65100"/>
    </linearGradient>
    <radialGradient id="ta-hl" cx="38%" cy="28%" r="54%">
      <stop offset="0%" stop-color="#FFE0B2" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="transparent"/>
    </radialGradient>
  </defs>
  <!-- Wide feather headdress — multi-color fan -->
  <ellipse cx="18" cy="20" rx="7" ry="22" fill="#00BCD4"  transform="rotate(-32 18 20)"/>
  <ellipse cx="28" cy="12" rx="6" ry="22" fill="#8BC34A"  transform="rotate(-18 28 12)"/>
  <ellipse cx="38" cy="7"  rx="6" ry="23" fill="#FF5722"  transform="rotate(-8 38 7)"/>
  <ellipse cx="50" cy="5"  rx="6" ry="24" fill="#FFD600"/>
  <ellipse cx="62" cy="7"  rx="6" ry="23" fill="#FF5722"  transform="rotate(8 62 7)"/>
  <ellipse cx="72" cy="12" rx="6" ry="22" fill="#8BC34A"  transform="rotate(18 72 12)"/>
  <ellipse cx="82" cy="20" rx="7" ry="22" fill="#00BCD4"  transform="rotate(32 82 20)"/>
  <!-- Feather tips (darker) -->
  <ellipse cx="18" cy="20" rx="3.5" ry="12" fill="#006978" transform="rotate(-32 18 20)" opacity="0.5"/>
  <ellipse cx="28" cy="12" rx="3"   ry="12" fill="#33691E" transform="rotate(-18 28 12)" opacity="0.5"/>
  <ellipse cx="50" cy="5"  rx="3"   ry="13" fill="#F9A825" opacity="0.5"/>
  <ellipse cx="72" cy="12" rx="3"   ry="12" fill="#33691E" transform="rotate(18 72 12)" opacity="0.5"/>
  <ellipse cx="82" cy="20" rx="3.5" ry="12" fill="#006978" transform="rotate(32 82 20)" opacity="0.5"/>
  <!-- Feather base band -->
  <rect x="22" y="30" width="56" height="7" rx="3.5" fill="#5D4037"/>
  <rect x="22" y="30" width="56" height="3" rx="1.5" fill="#795548" opacity="0.7"/>
  <!-- Face — narrow oval -->
  <ellipse cx="50" cy="64" rx="28" ry="33" fill="url(#ta-f)"/>
  <ellipse cx="50" cy="64" rx="28" ry="33" fill="url(#ta-hl)"/>
  <!-- Spiral cheek marks -->
  <path d="M24 62 Q21 58 24 54 Q27 50 24 46" stroke="#795548" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M76 62 Q79 58 76 54 Q73 50 76 46" stroke="#795548" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <!-- Eye sockets — wise, wide -->
  <ellipse cx="37" cy="57" rx="12.5" ry="13" fill="rgba(0,0,0,0.22)"/>
  <ellipse cx="63" cy="57" rx="12.5" ry="13" fill="rgba(0,0,0,0.22)"/>
  <!-- Eye whites -->
  <ellipse cx="37" cy="57" rx="11" ry="12" fill="white"/>
  <ellipse cx="63" cy="57" rx="11" ry="12" fill="white"/>
  <!-- Iris — warm amber-brown with star pattern -->
  <ellipse cx="37" cy="58" rx="8" ry="8.5" fill="#8D6E63"/>
  <ellipse cx="63" cy="58" rx="8" ry="8.5" fill="#8D6E63"/>
  <ellipse cx="37" cy="58" rx="5.8" ry="6.2" fill="#A1887F"/>
  <ellipse cx="63" cy="58" rx="5.8" ry="6.2" fill="#A1887F"/>
  <!-- Star iris pattern -->
  <path d="M37 51.5 L37.8 55.8 L41.5 54.5 L38.8 57.5 L42 60 L38 58.5 L38 63 L36 58.5 L32 60 L35.2 57.5 L32.5 54.5 L36.2 55.8Z" fill="#6D4C41" opacity="0.5"/>
  <path d="M63 51.5 L63.8 55.8 L67.5 54.5 L64.8 57.5 L68 60 L64 58.5 L64 63 L62 58.5 L58 60 L61.2 57.5 L58.5 54.5 L62.2 55.8Z" fill="#6D4C41" opacity="0.5"/>
  <!-- Pupils -->
  <ellipse cx="37" cy="58" rx="3.5" ry="4" fill="#080504"/>
  <ellipse cx="63" cy="58" rx="3.5" ry="4" fill="#080504"/>
  <!-- Eye shine -->
  <circle cx="34" cy="54.5" r="2.5" fill="white" opacity="0.92"/>
  <circle cx="60" cy="54.5" r="2.5" fill="white" opacity="0.92"/>
  <circle cx="38.5" cy="61" r="1.2" fill="rgba(255,255,255,0.42)"/>
  <circle cx="64.5" cy="61" r="1.2" fill="rgba(255,255,255,0.42)"/>
  <!-- Thoughtful brows — slightly raised outside -->
  <path d="M26.5 44.5 Q37 40 47.5 44.5" stroke="#4E342E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M52.5 44.5 Q63 40 73.5 44.5" stroke="#4E342E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- Nose — ornate bridge -->
  <path d="M46 68.5 L44 74 Q50 77.5 56 74 L54 68.5" fill="rgba(0,0,0,0.2)" stroke="#4E342E" stroke-width="1.2" stroke-linejoin="round"/>
  <line x1="50" y1="65.5" x2="50" y2="68.5" stroke="#6D4C41" stroke-width="1.5"/>
  <!-- Totem zigzag mouth -->
  <path d="M32 82 L38 78 L44 84 L50 78 L56 84 L62 78 L68 82" stroke="#3E2723" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M32 82 Q50 96 68 82 L68 86 Q50 97 32 86Z" fill="#4E342E" opacity="0.4"/>
  <!-- Feather drop earrings -->
  <ellipse cx="21" cy="62" rx="3" ry="8" fill="#FF5722" transform="rotate(-10 21 62)"/>
  <ellipse cx="21" cy="62" rx="1.5" ry="5" fill="#FF8A65" transform="rotate(-10 21 62)" opacity="0.7"/>
  <ellipse cx="79" cy="62" rx="3" ry="8" fill="#FF5722" transform="rotate(10 79 62)"/>
  <ellipse cx="79" cy="62" rx="1.5" ry="5" fill="#FF8A65" transform="rotate(10 79 62)" opacity="0.7"/>
  <!-- Forehead third-eye mark -->
  <ellipse cx="50" cy="40" rx="3" ry="4" fill="#FFD600"/>
  <ellipse cx="50" cy="40" rx="1.5" ry="2" fill="white" opacity="0.65"/>
</svg>`,
  },
]

// O(1) lookup by id
export const AVATAR_MAP = Object.fromEntries(AVATARS.map(a => [a.id, a]))
