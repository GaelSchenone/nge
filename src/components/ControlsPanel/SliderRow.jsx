export default function SliderRow({ label, value, min, max, step, onChange, formatValue }) {
  const display = formatValue ? formatValue(value) : value

  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '2px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#b0b0c8',
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#e8e8f0', fontWeight: 500 }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={rangeStyle}
      />
    </label>
  )
}

const rangeStyle = {
  width: '100%',
  height: 4,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: '#2a2a38',
  borderRadius: 2,
  outline: 'none',
  cursor: 'pointer',
  accentColor: '#ffffff',
}
