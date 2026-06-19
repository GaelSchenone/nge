export default function PresetCard({ preset, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(preset)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'none', cursor: 'pointer',
        padding: 0, textAlign: 'left', borderRadius: 'var(--radius-md)',
        overflow: 'hidden', outline: selected ? '1px solid var(--accent)' : '1px solid transparent',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{
        width: '100%', aspectRatio: '1 / 1',
        background: `linear-gradient(135deg, ${preset.color1 || '#333'}, ${preset.color2 || '#111'})`,
        borderRadius: 'var(--radius-sm)',
      }} />
      <span style={{
        fontSize: 10, color: 'var(--text-secondary)',
        padding: '0 4px 4px', whiteSpace: 'nowrap', overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {preset.name}
      </span>
    </button>
  )
}
