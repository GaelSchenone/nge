import { useState } from 'react'
import TabBar from '../ControlPanel/TabBar'
import PresetGrid from './PresetGrid'
import { IconChevronLeft } from '../icons/icons'

const BUILT_IN_PRESETS = [
  { id: 'stardust', name: 'Stardust', color1: '#A855F7', color2: '#6366F1' },
  { id: 'andromeda', name: 'Andromeda', color1: '#F59E0B', color2: '#EF4444' },
  { id: 'ice-cold', name: 'Ice Cold', color1: '#06B6D4', color2: '#3B82F6' },
  { id: 'sapphire', name: 'Sapphire', color1: '#8B5CF6', color2: '#1D4ED8' },
  { id: 'crimson', name: 'Crimson', color1: '#F43F5E', color2: '#BE185D' },
  { id: 'supernova', name: 'Supernova', color1: '#F97316', color2: '#FBBF24' },
  { id: 'emerald', name: 'Emerald', color1: '#10B981', color2: '#047857' },
  { id: 'nebula-rose', name: 'Nebula Rose', color1: '#EC4899', color2: '#7C3AED' },
  { id: 'deep-space', name: 'Deep Space', color1: '#1E293B', color2: '#0F172A' },
  { id: 'aurora', name: 'Aurora', color1: '#22D3EE', color2: '#4ADE80' },
  { id: 'magma', name: 'Magma', color1: '#FB923C', color2: '#DC2626' },
  { id: 'void', name: 'Void', color1: '#334155', color2: '#020617' },
]

export default function PresetsPanel({ savedPresets, onBack, onSelectPreset, onSaveCurrent }) {
  const [presetTab, setPresetTab] = useState('BUILT-IN')

  const presets = presetTab === 'BUILT-IN' ? BUILT_IN_PRESETS : (savedPresets || [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: 0,
          }}>
            <IconChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>PRESETS</span>
        </div>
      </div>

      <TabBar tabs={['BUILT-IN', 'SAVED']} active={presetTab} onChange={setPresetTab} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {presetTab === 'SAVED' && (!savedPresets || savedPresets.length === 0) ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 8, padding: '32px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>No saved presets</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, maxWidth: 180, lineHeight: 1.5 }}>
              Click "Save Current" below to save your first preset
            </p>
          </div>
        ) : (
          <PresetGrid
            presets={presets}
            onSelect={(preset) => onSelectPreset?.(preset)}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={onSaveCurrent} style={{
          width: '100%', padding: 8, fontSize: 11,
          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, fontFamily: 'inherit',
        }}>
          + Save Current
        </button>
      </div>
    </div>
  )
}
