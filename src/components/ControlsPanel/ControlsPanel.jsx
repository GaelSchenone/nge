import { useState, useCallback, useRef } from 'react'
import SectionHeader from './SectionHeader'
import SliderRow from './SliderRow'
import ColorRow from './ColorRow'
import { IconSave, IconExport, IconReset, IconChevronDown, IconChevronUp, IconShuffle } from '../icons/icons'
import styles from './ControlsPanel.module.css'

const PRESETS_KEY = 'stardust-presets'

function loadPresets() {
  try {
    return JSON.parse(localStorage.getItem(PRESETS_KEY) || '[]')
  } catch { return [] }
}

export default function ControlsPanel({ params, onChange, onReset, canvasRef, isOpen, onResetCamera }) {
  const [tab, setTab] = useState('main')
  const [openSections, setOpenSections] = useState({
    structure: true, dynamics: true, appearance: true,
    nebula: true, starfield: true, starfalls: true, camera: true, animation: true,
  })
  const [saved, setSaved] = useState(false)
  const [presets, setPresets] = useState(loadPresets)
  const [presetName, setPresetName] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const savedTimer = useRef(null)

  const toggleSection = useCallback((section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }, [])

  const update = useCallback((key, value) => {
    onChange({ ...params, [key]: value })
  }, [params, onChange])

  const updateSection = useCallback((section, key, value) => {
    onChange({ ...params, [section]: { ...params[section], [key]: value } })
  }, [params, onChange])

  const handleSave = useCallback(() => {
    try {
      localStorage.setItem('stardust-params', JSON.stringify(params))
      setSaved(true)
      clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSaved(false), 1500)
    } catch { /* noop */ }
  }, [params])

  const handleSavePreset = useCallback(() => {
    const name = presetName.trim() || `Preset ${presets.length + 1}`
    const updated = [...presets, { name, params: JSON.parse(JSON.stringify(params)) }]
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated))
    setPresets(updated)
    setPresetName('')
    setSaved(true)
    savedTimer.current = setTimeout(() => setSaved(false), 1500)
  }, [presets, presetName, params])

  const handleLoadPreset = useCallback((preset) => {
    onChange(preset.params)
  }, [onChange])

  const handleDeletePreset = useCallback((i) => {
    const updated = presets.filter((_, idx) => idx !== i)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(updated))
    setPresets(updated)
  }, [presets])

  const handleExport = useCallback(() => {
    const c = canvasRef?.current
    const el = c?.canvas ?? c
    if (!el) return
    const link = document.createElement('a')
    link.download = 'stardust-galaxy.png'
    link.href = el.toDataURL('image/png')
    link.click()
  }, [canvasRef])

  const handleExportComponent = useCallback(() => {
    // Generate a standalone React component with current params baked in
    const workerCode = `
self.onmessage=function({data}){
  const{_target,stars,radius,arms,spin,scatter,density,size,innerColor,outerColor}=data
  function hexToRgb(h){const v=parseInt(h.slice(1),16);return{r:((v>>16)&255)/255,g:((v>>8)&255)/255,b:(v&255)/255}}
  const i=hexToRgb(innerColor),o=hexToRgb(outerColor)
  const p=new Float32Array(stars*3),c=new Float32Array(stars*3),s=new Float32Array(stars)
  for(let n=0;n<stars;n++){
    const a=n%arms,ai=a/arms*Math.PI*2,t=Math.pow(Math.random(),density),r=t*radius
    const ang=ai+spin*r+(Math.random()-.5)*scatter*(1+r*.4),noi=scatter*r*.12,hf=.08+scatter*.18
    p[n*3]=Math.cos(ang)*r+(Math.random()-.5)*noi
    p[n*3+1]=(Math.random()-.5)*r*hf
    p[n*3+2]=Math.sin(ang)*r+(Math.random()-.5)*noi
    const mr=i.r+(o.r-i.r)*t,mg=i.g+(o.g-i.g)*t,mb=i.b+(o.b-i.b)*t
    c[n*3]=mr;c[n*3+1]=mg;c[n*3+2]=mb
    s[n]=size*(.5+(1-t)*1.5)*(.8+Math.random()*.4)
  }
  self.postMessage({_target,positions:p,colors:c,sizes:s},[p.buffer,c.buffer,s.buffer])
}`
    const workerBlob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(workerBlob)

    const code = `import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const VP = \`attribute float aSize;attribute vec3 aColor;varying vec3 vColor;
void main(){vColor=aColor;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*(5000.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}\`

const FP = \`varying vec3 vColor;
void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>.5)discard;float alpha=smoothstep(.5,.0,d);gl_FragColor=vec4(vColor,alpha);}\`

const DEFAULT = ${JSON.stringify(params, null, 2)}

export default function GalaxyBackground({ params: userParams, style, className }) {
  const p = userParams ? { ...DEFAULT, ...userParams, nebula: { ...DEFAULT.nebula, ...userParams?.nebula }, starfield: { ...DEFAULT.starfield, ...userParams?.starfield }, distant: { ...DEFAULT.distant, ...userParams?.distant }, animation: { ...DEFAULT.animation, ...userParams?.animation } } : DEFAULT
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const w = el.clientWidth, h = el.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(w, h)
    renderer.setClearColor(0x0a0a0f, 1)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 10000)
    camera.position.set(0, 6, 14)
    camera.lookAt(0, 0, 0)
    const gGroup = new THREE.Group()
    scene.add(gGroup)
    const worker = new Worker('${workerUrl}')
    worker.onmessage = ({ data }) => {
      const { positions, colors, sizes } = data
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
      const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: VP, fragmentShader: FP })
      const mesh = new THREE.Points(geo, mat)
      gGroup.add(mesh)
    }
    worker.postMessage({ _target: 'main', ...p })
    // Nebula
    if (p.nebula.enabled) {
      const canvas = document.createElement('canvas')
      canvas.width = 512; canvas.height = 512
      const ctx = canvas.getContext('2d')
      const grd = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
      grd.addColorStop(0, 'rgba(255,255,255,1)')
      grd.addColorStop(0.15, 'rgba(255,255,255,0.7)')
      grd.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 512)
      const tex = new THREE.CanvasTexture(canvas)
      for (let i = 0; i < 8; i++) {
        const armIdx = Math.floor(Math.random() * p.arms)
        const armOffset = (armIdx / p.arms) * Math.PI * 2
        const t = 0.3 + Math.random() * 0.6
        const r = t * p.radius
        const angle = armOffset + p.spin * r + (Math.random() - 0.5) * p.scatter
        const noise = p.scatter * r * 0.12
        const x = Math.cos(angle) * r + (Math.random() - 0.5) * noise
        const z = Math.sin(angle) * r + (Math.random() - 0.5) * noise
        const y = (Math.random() - 0.5) * r * 0.06
        const color = Math.random() > 0.5 ? p.nebula.color1 : p.nebula.color2
        const mat = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity: p.nebula.opacity, blending: THREE.AdditiveBlending, depthWrite: false })
        const sprite = new THREE.Sprite(mat)
        sprite.position.set(x, y, z)
        const scale = p.nebula.density * p.radius * 0.8
        sprite.scale.set(scale, scale, 1)
        gGroup.add(sprite)
      }
    }
    // Animation
    let lastTime = 0
    function animate(time) {
      requestAnimationFrame(animate)
      const dt = lastTime === 0 ? 16 : time - lastTime
      lastTime = time
      gGroup.rotation.y += p.distant?.speed || 1 * 0.0001 * Math.min(dt, 50) / 16
      renderer.render(scene, camera)
    }
    requestAnimationFrame(animate)
    return () => {
      renderer.dispose()
      worker.terminate()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={ref} style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0a0a0f', ...style }} className={className} />
}
`
    const blob = new Blob([code], { type: 'text/jsx' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'GalaxyBackground.jsx'
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
    setTimeout(() => URL.revokeObjectURL(workerUrl), 60000)
  }, [params])

  const handleResetCamera = useCallback(() => {
    onResetCamera?.()
  }, [onResetCamera])

  return (
    <aside className={`${styles.panel} ${!isOpen ? styles.panelCollapsed : ''}`}>
      <div className={styles.inner}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>CONTROLS</span>
          <button className={styles.resetBtn} onClick={onReset}>
            <IconReset size={12} />
            Reset
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'main' ? styles.tabActive : ''}`}
            onClick={() => setTab('main')}
          >MAIN</button>
          <button
            className={`${styles.tab} ${tab === 'distant' ? styles.tabActive : ''}`}
            onClick={() => setTab('distant')}
          >DISTANT</button>
        </div>

        {tab === 'main' ? (
          <>
            <SectionRow open={openSections.structure} onToggle={() => toggleSection('structure')} label="STRUCTURE">
              <SliderRow label="Stars" value={params.stars} min={1000} max={100000} step={1000} onChange={(v) => update('stars', v)} />
              <SliderRow label="Radius" value={params.radius} min={1} max={200} step={0.1} onChange={(v) => update('radius', v)} />
              <SliderRow label="Arms" value={params.arms} min={1} max={10} step={1} onChange={(v) => update('arms', v)} />
            </SectionRow>

            <SectionRow open={openSections.dynamics} onToggle={() => toggleSection('dynamics')} label="DYNAMICS">
              <SliderRow label="Spin" value={params.spin} min={0} max={5} step={0.01} onChange={(v) => update('spin', v)} />
              <SliderRow label="Scatter" value={params.scatter} min={0} max={5} step={0.01} onChange={(v) => update('scatter', v)} />
              <SliderRow label="Density" value={params.density} min={0.5} max={5} step={0.01} onChange={(v) => update('density', v)} />
            </SectionRow>

            <SectionRow open={openSections.appearance} onToggle={() => toggleSection('appearance')} label="APPEARANCE">
              <SliderRow label="Size" value={params.size} min={0.002} max={0.1} step={0.001} onChange={(v) => update('size', v)} formatValue={(v) => v.toFixed(3)} />
              <ColorRow label="Inner" color={params.innerColor} onChange={(v) => update('innerColor', v)} />
              <ColorRow label="Outer" color={params.outerColor} onChange={(v) => update('outerColor', v)} />
            </SectionRow>

            <SectionRow open={openSections.nebula} onToggle={() => toggleSection('nebula')} label="NEBULA">
              <ToggleRow label="Enable Nebula" checked={params.nebula.enabled} onChange={(v) => updateSection('nebula', 'enabled', v)} />
              {params.nebula.enabled && (
                <>
                  <SliderRow label="Density" value={params.nebula.density} min={0.1} max={2} step={0.01} onChange={(v) => updateSection('nebula', 'density', v)} />
                  <SliderRow label="Opacity" value={params.nebula.opacity} min={0} max={1} step={0.01} onChange={(v) => updateSection('nebula', 'opacity', v)} />
                  <ColorRow label="Color 1" color={params.nebula.color1} onChange={(v) => updateSection('nebula', 'color1', v)} />
                  <ColorRow label="Color 2" color={params.nebula.color2} onChange={(v) => updateSection('nebula', 'color2', v)} />
                </>
              )}
            </SectionRow>

            <SectionRow open={openSections.starfield} onToggle={() => toggleSection('starfield')} label="STARFIELD">
              <ToggleRow label="Enable Starfield" checked={params.starfield.enabled} onChange={(v) => updateSection('starfield', 'enabled', v)} />
              {params.starfield.enabled && (
                <>
                  <SliderRow label="Count" value={params.starfield.count} min={0} max={15000} step={100} onChange={(v) => updateSection('starfield', 'count', v)} />
                  <SliderRow label="Size" value={params.starfield.size} min={0.001} max={0.05} step={0.001} onChange={(v) => updateSection('starfield', 'size', v)} formatValue={(v) => v.toFixed(3)} />
                  <ColorRow label="Color" color={params.starfield.color} onChange={(v) => updateSection('starfield', 'color', v)} />
                </>
              )}
            </SectionRow>

            <SectionRow open={openSections.starfalls} onToggle={() => toggleSection('starfalls')} label="STARFALLS">
              <ToggleRow label="Enable Starfalls" checked={params.starfalls.enabled} onChange={(v) => updateSection('starfalls', 'enabled', v)} />
            </SectionRow>

            <div className={styles.section}>
              <div style={cameraHeaderStyle}>
                <span style={sectionLabelStyle}>CAMERA</span>
                <button style={cameraResetBtnStyle} onClick={handleResetCamera}>Reset</button>
              </div>
            </div>

            <SectionRow open={openSections.animation} onToggle={() => toggleSection('animation')} label="ANIMATION">
              <div style={segGroupStyle}>
                {['Static', 'Orbit', 'Spin'].map((m) => (
                  <button
                    key={m}
                    onClick={() => updateSection('animation', 'mode', m)}
                    style={{
                      ...segBtnStyle,
                      background: params.animation.mode === m ? '#ffffff' : 'transparent',
                      color: params.animation.mode === m ? '#0a0a0f' : '#6b6b80',
                      fontWeight: params.animation.mode === m ? 500 : 400,
                    }}
                  >{m}</button>
                ))}
              </div>
              <SliderRow label="Speed" value={params.animation.speed} min={0} max={10} step={0.1} onChange={(v) => updateSection('animation', 'speed', v)} />
            </SectionRow>
          </>
        ) : (
          <>
            <ToggleRow label="Enable Distant Galaxy" checked={params.distant.enabled} onChange={(v) => updateSection('distant', 'enabled', v)} />
            <SectionRow open={openSections.structure} onToggle={() => toggleSection('structure')} label="STRUCTURE">
              <SliderRow label="Stars" value={params.distant.stars} min={1000} max={100000} step={1000} onChange={(v) => updateSection('distant', 'stars', v)} />
              <SliderRow label="Radius" value={params.distant.radius} min={5} max={500} step={1} onChange={(v) => updateSection('distant', 'radius', v)} />
              <SliderRow label="Arms" value={params.distant.arms} min={1} max={10} step={1} onChange={(v) => updateSection('distant', 'arms', v)} />
            </SectionRow>
            <SectionRow open={openSections.dynamics} onToggle={() => toggleSection('dynamics')} label="DYNAMICS">
              <SliderRow label="Spin" value={params.distant.spin} min={0} max={5} step={0.01} onChange={(v) => updateSection('distant', 'spin', v)} />
              <SliderRow label="Scatter" value={params.distant.scatter} min={0} max={5} step={0.01} onChange={(v) => updateSection('distant', 'scatter', v)} />
              <SliderRow label="Speed" value={params.distant.speed} min={0} max={5} step={0.1} onChange={(v) => updateSection('distant', 'speed', v)} />
            </SectionRow>
            <SectionRow open={openSections.appearance} onToggle={() => toggleSection('appearance')} label="APPEARANCE">
              <SliderRow label="Size" value={params.distant.size} min={0.01} max={2} step={0.01} onChange={(v) => updateSection('distant', 'size', v)} />
              <ColorRow label="Inner" color={params.distant.innerColor} onChange={(v) => updateSection('distant', 'innerColor', v)} />
              <ColorRow label="Outer" color={params.distant.outerColor} onChange={(v) => updateSection('distant', 'outerColor', v)} />
            </SectionRow>
          </>
        )}

        <div style={{ borderTop: '1px solid #1e1e26', paddingTop: 10, marginTop: 4 }}>
          <div className={styles.actionRow}>
            <button className={styles.actionBtn} onClick={handleSave}>
              <IconSave size={13} />
              {saved ? 'Saved ✓' : 'Save'}
            </button>
            <button className={styles.actionBtn} onClick={handleExport}>
              <IconExport size={13} />
              PNG
            </button>
            <button className={styles.actionBtn} onClick={handleExportComponent} style={{ fontSize: 10 }}>
              <IconShuffle size={12} />
              React
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            <button onClick={() => setShowPresets(!showPresets)} style={{
              display: 'flex', alignItems: 'center', gap: 4, width: '100%',
              padding: '5px 0', border: 'none', background: 'none',
              color: '#6b6b80', fontSize: '0.65rem', letterSpacing: '1px',
              textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <span>PRESETS ({presets.length})</span>
              {showPresets ? <IconChevronUp size={10} /> : <IconChevronDown size={10} />}
            </button>
            {showPresets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 4 }}>
                {presets.length === 0 && (
                  <span style={{ fontSize: 11, color: '#4a4a58' }}>No saved presets</span>
                )}
                {presets.map((p, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 6px', borderRadius: 6,
                    background: '#111116', border: '1px solid #2a2a38',
                  }}>
                    <button onClick={() => handleLoadPreset(p)} style={{
                      flex: 1, textAlign: 'left', background: 'none', border: 'none',
                      color: '#b0b0c8', fontSize: 11, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                    }}>{p.name}</button>
                    <button onClick={() => handleDeletePreset(i)} style={{
                      background: 'none', border: 'none', color: '#5a2a2a',
                      cursor: 'pointer', fontSize: 13, padding: '0 2px',
                    }}>✕</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name..."
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset() }}
                    style={{
                      flex: 1, background: '#111116', border: '1px solid #2a2a38',
                      borderRadius: 6, padding: '5px 8px', color: '#e8e8f0',
                      fontSize: 11, outline: 'none', fontFamily: 'inherit',
                    }}
                  />
                  <button onClick={handleSavePreset} style={{
                    padding: '5px 10px', border: '1px solid #2a2a38',
                    borderRadius: 6, background: 'transparent', color: '#b0b0c8',
                    fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                  }}>+</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}

function SectionRow({ label, open, onToggle, children }) {
  return (
    <div className={styles.section}>
      <SectionHeader label={label} isOpen={open} onToggle={onToggle} />
      {open && <div className={styles.sectionContent}>{children}</div>}
    </div>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: 11, color: '#b0b0c8', cursor: 'pointer', padding: '2px 0',
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#f5a623', width: 14, height: 14, cursor: 'pointer' }}
      />
      {label}
    </label>
  )
}

const sectionLabelStyle = {
  color: '#6b6b80',
  fontSize: '0.65rem',
  letterSpacing: '1px',
  textTransform: 'uppercase',
}

const cameraHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 0',
}

const cameraResetBtnStyle = {
  padding: '3px 10px',
  border: '1px solid #2a2a38',
  borderRadius: 6,
  background: 'transparent',
  color: '#b0b0c8',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
}

const segGroupStyle = {
  display: 'flex',
  borderRadius: 6,
  overflow: 'hidden',
  border: '1px solid #2a2a38',
}

const segBtnStyle = {
  flex: 1,
  padding: '5px 8px',
  border: 'none',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background 0.15s, color 0.15s',
}
