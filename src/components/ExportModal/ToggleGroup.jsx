export default function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 12px', fontSize: 11, fontWeight: 500,
            background: value === opt.value ? 'var(--accent-dim)' : 'var(--bg-surface)',
            border: value === opt.value ? '1px solid var(--accent)' : '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: value === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
