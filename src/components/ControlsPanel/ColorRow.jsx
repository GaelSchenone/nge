import { useRef } from 'react'

export default function ColorRow({ label, color, onChange }) {
  const inputRef = useRef(null)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '3px 0',
      }}
    >
      <span style={{ fontSize: 11, color: '#b0b0c8' }}>{label}</span>
      <button
        onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 8px 3px 4px',
          border: '1px solid #2a2a38',
          borderRadius: 6,
          background: '#111116',
          color: '#e8e8f0',
          fontSize: 11,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: color,
            border: '1px solid #2a2a38',
            flexShrink: 0,
          }}
        />
        {color.toUpperCase()}
      </button>
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
