// ── Leaf SVG Path Definitions ─────────────────────────────────────────────────
// 5 distinct palm/fern leaf silhouettes for variety

export const LEAF_SHAPES = [
  {
    id: 'palm-spear',
    path: 'M20,0 Q22,10 20,20 Q18,30 20,40 Q22,50 20,60 L18,60 Q16,50 18,40 Q20,30 18,20 Q16,10 18,0 Z M15,15 L10,18 L15,20 M25,15 L30,18 L25,20 M15,35 L10,38 L15,40 M25,35 L30,38 L25,40',
    viewBox: '0 0 40 60',
    color: '#1a3a1a',
  },
  {
    id: 'palm-fan',
    path: 'M30,50 Q28,40 25,30 Q22,20 20,10 Q18,20 15,30 Q12,40 10,50 L12,52 Q15,42 18,32 Q20,22 20,15 Q20,22 22,32 Q25,42 28,52 Z M8,45 L5,48 L8,50 M32,45 L35,48 L32,50 M10,30 L7,33 L10,35 M30,30 L33,33 L30,35',
    viewBox: '0 0 40 60',
    color: '#2d5a2d',
  },
  {
    id: 'fern-frond',
    path: 'M25,5 Q23,15 22,25 Q21,35 20,45 Q19,35 18,25 Q17,15 15,5 L17,5 Q18,12 19,20 Q20,28 20,35 Q20,28 21,20 Q22,12 23,5 Z M14,12 L10,14 M26,12 L30,14 M14,22 L10,24 M26,22 L30,24 M14,32 L10,34 M26,32 L30,34 M14,42 L10,44 M26,42 L30,44',
    viewBox: '0 0 40 50',
    color: '#1a3a1a',
  },
  {
    id: 'palm-curved',
    path: 'M20,10 Q25,20 28,30 Q30,40 30,50 L28,50 Q28,40 26,30 Q24,22 20,15 Q16,22 14,30 Q12,40 12,50 L10,50 Q10,40 12,30 Q15,20 20,10 Z M8,35 L5,37 M32,35 L35,37 M8,45 L5,47 M32,45 L35,47',
    viewBox: '0 0 40 60',
    color: '#2d5a2d',
  },
  {
    id: 'fern-narrow',
    path: 'M22,0 Q21,15 20,30 Q19,45 18,60 L20,60 Q21,45 22,30 Q23,15 24,0 Z M16,10 L12,12 M26,10 L30,12 M16,20 L12,22 M26,20 L30,22 M16,30 L12,32 M26,30 L30,32 M16,40 L12,42 M26,40 L30,42 M16,50 L12,52 M26,50 L30,52',
    viewBox: '0 0 40 60',
    color: '#1a3a1a',
  },
]

// Helper to get random leaf shape
export function getRandomLeafShape() {
  return LEAF_SHAPES[Math.floor(Math.random() * LEAF_SHAPES.length)]
}
