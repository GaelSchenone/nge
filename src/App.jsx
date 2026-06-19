import { useState, useCallback, useRef } from 'react'
import GalaxyCanvas from './components/GalaxyCanvas/GalaxyCanvas'
import ControlPanel from './components/ControlPanel/ControlPanel'
import PresetsPanel from './components/PresetsPanel/PresetsPanel'
import ExportModal from './components/ExportModal/ExportModal'
import { DEFAULT_PARAMS } from './constants'
import { randomColor } from './utils/colorUtils'
import { IconShuffle, IconPlay, IconPause, IconLayout } from './components/icons/icons'

const PRESETS_KEY = 'nge-presets'

function loadSavedPresets() {
  try { return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]') }
  catch { return [] }
}

function saveSavedPresets(presets) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randFloat(min, max) {
  return Math.random() * (max - min) + min
}

function randomizeParams() {
  const modes = ['Static', 'Orbit', 'Spin']
  return {
    ...DEFAULT_PARAMS,
    stars: randInt(10000, 120000),
    radius: randFloat(2, 15),
    arms: randInt(2, 8),
    spin: randFloat(0.5, 4),
    scatter: randFloat(0.05, 1.2),
    density: randFloat(1, 5),
    size: randFloat(0.005, 0.05),
    innerColor: randomColor(),
    outerColor: randomColor(),
    nebula: {
      enabled: Math.random() > 0.3,
      density: randFloat(0.2, 1.5),
      opacity: randFloat(0.2, 0.7),
      color1: randomColor(),
      color2: randomColor(),
    },
    starfield: { enabled: true, count: randInt(1000, 8000), size: randFloat(0.003, 0.03), color: '#FFFFFF' },
    starfalls: { enabled: Math.random() > 0.6 },
    animation: { mode: modes[randInt(0, 2)], speed: randFloat(0.5, 5) },
    distant: {
      ...DEFAULT_PARAMS.distant,
      stars: randInt(10000, 150000), radius: randFloat(10, 100),
      arms: randInt(2, 8), spin: randFloat(0.5, 4),
      scatter: randFloat(0.05, 1.5), speed: randFloat(0.1, 3),
      size: randFloat(0.05, 1), innerColor: randomColor(), outerColor: randomColor(),
    },
  }
}

export default function App() {
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem('stardust-params')
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS
    } catch { return DEFAULT_PARAMS }
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [view, setView] = useState('controls') // 'controls' | 'presets'
  const [exportOpen, setExportOpen] = useState(false)
  const [savedPresets, setSavedPresets] = useState(loadSavedPresets)
  const canvasRef = useRef(null)

  const handleTogglePlay = useCallback(() => setIsPlaying((p) => !p), [])
  const handleShuffle = useCallback(() => setParams(randomizeParams()), [])
  const handleReset = useCallback(() => setParams(DEFAULT_PARAMS), [])
  const handleResetCamera = useCallback(() => canvasRef.current?.resetCamera(), [])

  const handleSaveCurrentPreset = useCallback(() => {
    const name = `Preset ${savedPresets.length + 1}`
    const newPreset = {
      id: `saved-${Date.now()}`,
      name,
      color1: params.innerColor,
      color2: params.outerColor,
      params: JSON.parse(JSON.stringify(params)),
    }
    const updated = [...savedPresets, newPreset]
    setSavedPresets(updated)
    saveSavedPresets(updated)
  }, [savedPresets, params])

  const handleSelectPreset = useCallback((preset) => {
    if (preset.params) {
      setParams(preset.params)
    }
    setView('controls')
  }, [])

  const iconBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, border: 'none', borderRadius: 'var(--radius-md)',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'color 0.15s, background 0.15s',
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base)' }}>
      {/* Left: Canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GalaxyCanvas ref={canvasRef} params={params} isPlaying={isPlaying} />

        {/* Top toolbar */}
        <div style={{
          position: 'absolute', top: 12, left: 12, right: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          pointerEvents: 'none', zIndex: 10,
        }}>
          <span style={{
            fontSize: 13, fontWeight: 500, letterSpacing: '0.3em',
            color: 'var(--text-primary)', pointerEvents: 'auto',
          }}>
            <span style={{ color: 'var(--accent)', marginRight: 4 }}>✦</span> NGE
          </span>
          <div style={{ display: 'flex', gap: 4, pointerEvents: 'auto' }}>
            <button style={iconBtn} onClick={handleShuffle} title="Shuffle">
              <IconShuffle size={16} />
            </button>
            <button style={iconBtn} onClick={handleTogglePlay} title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
            </button>
          </div>
        </div>

        {/* Bottom-left presets toggle */}
        <button onClick={() => setView(view === 'presets' ? 'controls' : 'presets')} style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-md)', background: 'rgba(22,22,22,0.85)',
          color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <IconLayout size={14} />
          Presets
        </button>
      </div>

      {/* Right: Panel */}
      <aside style={{
        width: 280, flexShrink: 0,
        background: 'var(--bg-panel)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {view === 'controls' ? (
          <ControlPanel
            params={params}
            onChange={setParams}
            onReset={handleReset}
            onResetCamera={handleResetCamera}
            onOpenExport={() => setExportOpen(true)}
          />
        ) : (
          <PresetsPanel
            savedPresets={savedPresets}
            onBack={() => setView('controls')}
            onSelectPreset={handleSelectPreset}
            onSaveCurrent={handleSaveCurrentPreset}
          />
        )}
      </aside>

      {/* Export Modal */}
      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasRef={canvasRef}
      />
    </div>
  )
}
