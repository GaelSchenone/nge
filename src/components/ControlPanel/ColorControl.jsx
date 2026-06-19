import { useRef } from 'react'

const styles = {
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 16px',
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-secondary)',
    width: 64,
    flexShrink: 0,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: '50%',
    cursor: 'pointer',
    border: '1px solid var(--border-strong)',
    flexShrink: 0,
  },
  hex: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-secondary)',
    fontFamily: 'monospace',
  },
}

export default function ColorControl({ label, color, onChange }) {
  const inputRef = useRef(null)

  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <div
        style={{ ...styles.swatch, background: color }}
        onClick={() => inputRef.current?.click()}
      />
      <span style={styles.hex}>{color.toUpperCase()}</span>
      <input
        ref={inputRef}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
      />
    </div>
  )
}
