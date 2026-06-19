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
  slider: {
    flex: 1,
    height: 2,
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    cursor: 'pointer',
    border: 'none',
    borderRadius: 1,
    background: `var(--bg-active)`,
  },
  value: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    width: 36,
    textAlign: 'right',
    flexShrink: 0,
  },
}

export default function SliderControl({ label, min, max, value, step = 1, onChange, formatValue }) {
  const pct = ((value - min) / (max - min)) * 100
  const display = formatValue ? formatValue(value) : value

  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          ...styles.slider,
          background: `linear-gradient(to right, #ffffff 0%, #ffffff ${pct}%, var(--bg-active) ${pct}%, var(--bg-active) 100%)`,
        }}
      />
      <span style={styles.value}>{display}</span>
    </div>
  )
}
