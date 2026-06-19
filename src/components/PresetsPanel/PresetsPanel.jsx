import { useState } from 'react'
import TabBar from '../ControlPanel/TabBar'
import PresetGrid from './PresetGrid'
import { IconChevronLeft } from '../icons/icons'

function mkPreset(id, name, inner, outer, bg, overrides = {}) {
  return {
    id, name, color1: inner, color2: outer,
    params: {
      stars: 90000, radius: 8, arms: 5, spin: 1.8, scatter: 0.35, density: 2.8, size: 0.018,
      innerColor: inner, outerColor: outer,
      bgColor: bg,
      nebula: { enabled: true, density: 0.7, opacity: 0.4, color1: inner, color2: outer },
      starfield: { enabled: true, count: 8000, size: 0.015, color: '#FFFFFF' },
      starfalls: { enabled: false },
      animation: { mode: 'Orbit', speed: 2.5 },
      distant: {
        enabled: true, stars: 100000, radius: 80, arms: 5, spin: 2, scatter: 0.4, speed: 1,
        size: 0.2, innerColor: inner, outerColor: outer,
      },
      ...overrides,
    },
  }
}

const BUILT_IN_PRESETS = [
  mkPreset('stardust', 'Stardust', '#A855F7', '#6366F1', '#0a0a0f'),
  mkPreset('andromeda', 'Andromeda', '#F59E0B', '#EF4444', '#0a0a0f'),
  mkPreset('ice-cold', 'Ice Cold', '#06B6D4', '#3B82F6', '#0a1128'),
  mkPreset('sapphire', 'Sapphire', '#8B5CF6', '#1D4ED8', '#050510', { scatter: 0.5, arms: 4 }),
  mkPreset('crimson', 'Crimson', '#F43F5E', '#BE185D', '#100505', { spin: 2.5, starfalls: { enabled: true } }),
  mkPreset('supernova', 'Supernova', '#F97316', '#FBBF24', '#0a0a0f', { density: 3.5, size: 0.025 }),
  mkPreset('emerald', 'Emerald', '#10B981', '#047857', '#050f0a', { stars: 120000, radius: 12 }),
  mkPreset('nebula-rose', 'Nebula Rose', '#EC4899', '#7C3AED', '#0f0510', { scatter: 0.6, nebula: { enabled: true, density: 1.0, opacity: 0.5, color1: '#EC4899', color2: '#7C3AED' } }),
  mkPreset('deep-space', 'Deep Space', '#1E293B', '#0F172A', '#020617', { stars: 50000, radius: 15, nebula: { enabled: true, density: 0.3, opacity: 0.2, color1: '#1E293B', color2: '#0F172A' } }),
  mkPreset('aurora', 'Aurora', '#22D3EE', '#4ADE80', '#0a1008', { scatter: 0.8, distant: { enabled: true, stars: 100000, radius: 80, arms: 5, spin: 2, scatter: 0.6, speed: 1, size: 0.2, innerColor: '#22D3EE', outerColor: '#4ADE80' } }),
  mkPreset('magma', 'Magma', '#FB923C', '#DC2626', '#0f0500', { spin: 3, scatter: 0.7, size: 0.022 }),
  mkPreset('void', 'Void', '#334155', '#020617', '#000000', { stars: 30000, radius: 20, scatter: 1.2, nebula: { enabled: false, density: 0, opacity: 0, color1: '#334155', color2: '#020617' }, starfield: { enabled: true, count: 15000, size: 0.01, color: '#FFFFFF' } }),
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
