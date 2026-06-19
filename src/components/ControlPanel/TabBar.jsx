export default function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--border)',
      padding: '0 16px',
    }}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '8px 0',
            marginRight: 20,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            letterSpacing: '0.06em',
            color: active === tab ? 'var(--text-primary)' : 'var(--text-muted)',
            background: 'none',
            border: 'none',
            borderBottom: active === tab ? '2px solid var(--text-primary)' : '2px solid transparent',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'color 0.15s',
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
