import { useState, useCallback, useRef, useEffect } from 'react'
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
      // Check URL hash for shared params first
      const hash = window.location.hash
      if (hash.startsWith('#p=')) {
        const decoded = JSON.parse(atob(hash.slice(3)))
        return { ...DEFAULT_PARAMS, ...decoded }
      }
      const saved = localStorage.getItem('stardust-params')
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS
    } catch { return DEFAULT_PARAMS }
  })
  const [isPlaying, setIsPlaying] = useState(true)
  const [view, setView] = useState('controls')
  const [exportOpen, setExportOpen] = useState(false)
  const [savedPresets, setSavedPresets] = useState(loadSavedPresets)
  const [panelWidth, setPanelWidth] = useState(() => {
    try { return Number(localStorage.getItem('nge-panel-width')) || 280 }
    catch { return 280 }
  })
  const canvasRef = useRef(null)
  const dragRef = useRef(null)

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
    if (preset.params) setParams(preset.params)
    setView('controls')
  }, [])

  // Panel resize logic
  const isDragging = useRef(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return
      const newWidth = window.innerWidth - e.clientX - 12
      const clamped = Math.max(200, Math.min(600, newWidth))
      setPanelWidth(clamped)
    }
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  // Persist panel width
  useEffect(() => {
    localStorage.setItem('nge-panel-width', String(panelWidth))
  }, [panelWidth])

  const handleDragStart = useCallback(() => {
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  const iconBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, border: 'none', borderRadius: 'var(--radius-md)',
    background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'color 0.15s, background 0.15s',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: 'var(--bg-base)' }}>
      <GalaxyCanvas ref={canvasRef} params={params} isPlaying={isPlaying} />

      {/* Top toolbar */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12 + panelWidth + 12 + 8,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        pointerEvents: 'none', zIndex: 15,
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
        position: 'absolute', bottom: 16, left: 16, zIndex: 15,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-md)', background: 'rgba(22,22,22,0.85)',
        color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
        fontFamily: 'inherit',
      }}>
        <IconLayout size={14} />
        Presets
      </button>

      {/* Draggable panel */}
      <aside style={{
        position: 'absolute', top: 12, right: 12, bottom: 12,
        width: panelWidth,
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        zIndex: 10,
      }}>
        {/* Drag handle — thin strip on the left edge */}
        <div
          ref={dragRef}
          onMouseDown={handleDragStart}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 5,
            cursor: 'col-resize', zIndex: 20,
          }}
        />
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

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        canvasRef={canvasRef}
      />
    </div>
  )
}
