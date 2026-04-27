import { Component } from 'react'

// ── ErrorBoundary — catches React render errors ───────────────────────────────

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Render error:', error, info)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#0d0400',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: 24,
        fontFamily: '"Crimson Text", serif',
      }}>
        {/* Confused tiki SVG */}
        <svg viewBox="0 0 80 100" width={80} height={100} aria-hidden="true">
          <ellipse cx="40" cy="54" rx="32" ry="40" fill="#b8860b"/>
          <ellipse cx="40" cy="54" rx="29" ry="37" fill="#c9981d"/>
          <path d="M12 30 Q40 16 68 30" stroke="#d4af37" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
          {/* Worried brows */}
          <path d="M16 46 Q22 42 32 47" stroke="#7a5200" strokeWidth="3" strokeLinecap="round" fill="none"/>
          <path d="M48 47 Q58 42 64 46" stroke="#7a5200" strokeWidth="3" strokeLinecap="round" fill="none"/>
          {/* X eyes */}
          <line x1="20" y1="47" x2="32" y2="55" stroke="#1a0800" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="32" y1="47" x2="20" y2="55" stroke="#1a0800" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="48" y1="47" x2="60" y2="55" stroke="#1a0800" strokeWidth="3.5" strokeLinecap="round"/>
          <line x1="60" y1="47" x2="48" y2="55" stroke="#1a0800" strokeWidth="3.5" strokeLinecap="round"/>
          {/* Wavy mouth */}
          <path d="M26 73 Q32 68 38 73 Q44 78 50 73 Q56 68 62 73" stroke="#1a0800" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          {/* Gem — red from error */}
          <circle cx="40" cy="24" r="4" fill="#c0392b" stroke="#e74c3c" strokeWidth="1"/>
        </svg>

        <div style={{
          fontFamily: '"Cinzel Decorative", cursive',
          fontSize: 18, fontWeight: 700,
          color: '#d4af37',
          textShadow: '0 0 16px rgba(212,175,55,0.4)',
          textAlign: 'center',
        }}>
          The Tikis Are Confused…
        </div>

        <div style={{
          fontSize: 13,
          color: 'rgba(245,234,208,0.55)',
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: 280,
          lineHeight: 1.5,
        }}>
          Something went wrong in the ritual chamber.
          The ancient spirits require a fresh start.
        </div>

        {this.state.error?.message && (
          <div style={{
            fontSize: 11,
            color: 'rgba(192,57,43,0.7)',
            fontFamily: 'monospace',
            background: 'rgba(120,10,10,0.3)',
            border: '1px solid rgba(192,57,43,0.3)',
            borderRadius: 6,
            padding: '6px 12px',
            maxWidth: 320,
            wordBreak: 'break-all',
          }}>
            {this.state.error.message}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            background: 'linear-gradient(145deg, #4d2a0a, #3d1f0a)',
            border: '2px solid #d4af37',
            borderRadius: 8,
            color: '#d4af37',
            padding: '14px 28px',
            fontSize: 13,
            fontFamily: '"Cinzel Decorative", cursive',
            fontWeight: 700,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          Restart Game
        </button>
      </div>
    )
  }
}
