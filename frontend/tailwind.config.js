/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cinzel Decorative"', 'cursive'],
        body:    ['"Crimson Text"', 'serif'],
      },
      colors: {
        wood: {
          dark:  '#1a0800',
          mid:   '#3d1f0a',
          light: '#6b3a1f',
          plank: '#8B4513',
        },
        cardboard: '#c8945a',
        cream:     '#f5ead0',
        gold:      '#d4af37',
        torch:     '#ff6b1a',
        groove:    '#0d0400',
        tiki: {
          hookipa: '#8a8a8a',
          lani:    '#7b2fbe',
          kai:     '#c0392b',
          malu:    '#e91e8c',
          nalu:    '#f39c12',
          pele:    '#e67e22',
          honu:    '#27ae60',
          mana:    '#2980b9',
          koa:     '#795548',
        },
      },
      boxShadow: {
        'torch-glow': '0 0 20px 6px rgba(255,107,26,0.5)',
        'gold-glow':  '0 0 12px 3px rgba(212,175,55,0.6)',
        'card-lift':  '0 12px 28px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'wood-grain': [
          'repeating-linear-gradient(92deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
          'repeating-linear-gradient(178deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 10px)',
        ].join(', '),
      },
    },
  },
  plugins: [],
};
