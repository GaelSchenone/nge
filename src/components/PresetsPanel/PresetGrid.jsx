import PresetCard from './PresetCard'

export default function PresetGrid({ presets, onSelect, selectedId }) {
  if (!presets || presets.length === 0) return null
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
      padding: 12, overflowY: 'auto',
    }}>
      {presets.map((preset) => (
        <PresetCard
          key={preset.id}
          preset={preset}
          selected={preset.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
