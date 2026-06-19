import { useState, useCallback, useRef } from 'react'
import Header from './components/Header/Header'
import GalaxyCanvas from './components/GalaxyCanvas/GalaxyCanvas'
import ControlsPanel from './components/ControlsPanel/ControlsPanel'
import { DEFAULT_PARAMS } from './constants'
import { randomColor } from './utils/colorUtils'
import styles from './App.module.css'

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
    starfield: {
      enabled: true,
      count: randInt(1000, 8000),
      size: randFloat(0.003, 0.03),
      color: '#FFFFFF',
    },
    starfalls: {
      enabled: Math.random() > 0.6,
    },
    animation: {
      mode: modes[randInt(0, 2)],
      speed: randFloat(0.5, 5),
    },
    distant: {
      ...DEFAULT_PARAMS.distant,
      stars: randInt(10000, 150000),
      radius: randFloat(10, 100),
      arms: randInt(2, 8),
      spin: randFloat(0.5, 4),
      scatter: randFloat(0.05, 1.5),
      speed: randFloat(0.1, 3),
      size: randFloat(0.05, 1),
      innerColor: randomColor(),
      outerColor: randomColor(),
    },
  }
}

function App() {
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem('stardust-params')
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS
    } catch {
      return DEFAULT_PARAMS
    }
  })

  const [isPlaying, setIsPlaying] = useState(true)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const canvasRef = useRef(null)

  const handleTogglePlay = useCallback(() => setIsPlaying((p) => !p), [])
  const handleTogglePanel = useCallback(() => setIsPanelOpen((p) => !p), [])
  const handleShuffle = useCallback(() => setParams(randomizeParams()), [])
  const handleReset = useCallback(() => setParams(DEFAULT_PARAMS), [])
  const handleResetCamera = useCallback(() => canvasRef.current?.resetCamera(), [])

  return (
    <div className={styles.app}>
      <Header
        isPlaying={isPlaying}
        isPanelOpen={isPanelOpen}
        onTogglePlay={handleTogglePlay}
        onTogglePanel={handleTogglePanel}
        onShuffle={handleShuffle}
      />
      <div className={styles.main}>
        <GalaxyCanvas
          ref={canvasRef}
          params={params}
          isPlaying={isPlaying}
        />
        <ControlsPanel
          params={params}
          onChange={setParams}
          onReset={handleReset}
          canvasRef={canvasRef}
          isOpen={isPanelOpen}
          onResetCamera={handleResetCamera}
        />
      </div>
    </div>
  )
}

export default App
