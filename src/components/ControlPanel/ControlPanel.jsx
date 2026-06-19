import { useState, useCallback, useRef } from 'react'
import ControlSection from './ControlSection'
import SliderControl from './SliderControl'
import ColorControl from './ColorControl'
import TabBar from './TabBar'
import { IconSave, IconExport, IconShuffle } from '../icons/icons'

export default function ControlPanel({ params, onChange, onReset, onResetCamera, onOpenExport }) {
  const [tab, setTab] = useState('MAIN')
  const [saved, setSaved] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const savedTimer = useRef(null)

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
    } catch { /* empty - localStorage may be unavailable */ }
  }, [params])

  const handleExport = useCallback(() => {
    onOpenExport?.()
  }, [onOpenExport])

  const handleShareLink = useCallback(() => {
    try {
      const encoded = btoa(JSON.stringify(params))
      const url = `${window.location.origin}${window.location.pathname}#p=${encoded}`
      navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {}
  }, [params])

  const handleExportComponent = useCallback(() => {
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
    p[n*3+1]=(Math.random()-.5)*r*hf;p[n*3+2]=Math.sin(ang)*r+(Math.random()-.5)*noi
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

const VP=\`attribute float aSize;attribute vec3 aColor;varying vec3 vColor;
void main(){vColor=aColor;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*(5000.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}\`
const FP=\`varying vec3 vColor;
void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>.5)discard;float alpha=smoothstep(.5,.0,d);gl_FragColor=vec4(vColor,alpha);}\`
const P=${JSON.stringify(params)}
export default function GalaxyBG({style,className}){
  const ref=useRef(null)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const w=el.clientWidth,h=el.clientHeight
    const r=new THREE.WebGLRenderer({antialias:true})
    r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(w,h);r.setClearColor(new THREE.Color(P.bgColor||'#0a0a0f'),1)
    el.appendChild(r.domElement)
    const s=new THREE.Scene(),c=new THREE.PerspectiveCamera(60,w/h,0.1,1e4)
    c.position.set(0,6,14);c.lookAt(0,0,0)
    const gg=new THREE.Group();s.add(gg)
    const wk=new Worker('${workerUrl}')
    wk.onmessage=({data})=>{
      const{positions,colors,sizes}=data
      const g=new THREE.BufferGeometry()
      g.setAttribute('position',new THREE.BufferAttribute(positions,3))
      g.setAttribute('aColor',new THREE.BufferAttribute(colors,3))
      g.setAttribute('aSize',new THREE.BufferAttribute(sizes,1))
      const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:VP,fragmentShader:FP})
      gg.add(new THREE.Points(g,m))
    }
    wk.postMessage({_target:'main',...P})
    let lt=0
    function anim(t){requestAnimationFrame(anim);lt||=t-16;const dt=Math.min(t-lt,50)/16;lt=t;gg.rotation.y+=.0002*dt;r.render(s,c)}
    requestAnimationFrame(anim)
    return()=>{r.dispose();wk.terminate();r.domElement.remove()}
  },[])
  return<dib ref={ref} style={{position:'fixed',inset:0,overflow:'hidden',...style}} className={className}/>
}`
    const blob = new Blob([code], { type: 'text/jsx' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'GalaxyBackground.jsx'
    link.href = url; link.click()
    URL.revokeObjectURL(url)
    setTimeout(() => URL.revokeObjectURL(workerUrl), 60000)
  }, [params])

  const handleResetCamera = useCallback(() => onResetCamera?.(), [onResetCamera])

  const rowLabel = { fontSize: 11, color: '#888', width: 64, flexShrink: 0 }

  const sectionBase = {
    borderBottom: '1px solid var(--border)',
  }
  const rowBase = {
    display: 'flex', alignItems: 'center', gap: 10, padding: '6px 16px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '0.3em', color: 'var(--text-primary)' }}>
          <span style={{ color: 'var(--accent)', marginRight: 4 }}>✦</span> NGE
        </span>
        <button onClick={onReset} style={{
          padding: '4px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
          background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          <IconSave size={11} /> Reset
        </button>
      </div>

      {/* Tabs */}
      <TabBar tabs={['MAIN', 'DISTANT']} active={tab} onChange={setTab} />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'MAIN' ? (
          <>
            <ControlSection title="STRUCTURE">
              <SliderControl label="Stars" min={1000} max={100000} step={1000} value={params.stars} onChange={(v) => update('stars', v)} />
              <SliderControl label="Radius" min={1} max={200} step={0.1} value={params.radius} onChange={(v) => update('radius', v)} />
              <SliderControl label="Arms" min={1} max={10} step={1} value={params.arms} onChange={(v) => update('arms', v)} />
            </ControlSection>

            <ControlSection title="DYNAMICS">
              <SliderControl label="Spin" min={0} max={5} step={0.01} value={params.spin} onChange={(v) => update('spin', v)} />
              <SliderControl label="Scatter" min={0} max={5} step={0.01} value={params.scatter} onChange={(v) => update('scatter', v)} />
              <SliderControl label="Density" min={0.5} max={5} step={0.01} value={params.density} onChange={(v) => update('density', v)} />
            </ControlSection>

            <ControlSection title="APPEARANCE">
              <SliderControl label="Size" min={0.002} max={0.1} step={0.001} value={params.size} onChange={(v) => update('size', v)} formatValue={(v) => v.toFixed(3)} />
              <ColorControl label="Inner" color={params.innerColor} onChange={(v) => update('innerColor', v)} />
              <ColorControl label="Outer" color={params.outerColor} onChange={(v) => update('outerColor', v)} />
              <div style={{ ...rowBase }}>
                <span style={rowLabel}>Bg</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid var(--border-strong)', background: params.bgColor || '#0a0a0f', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => { const i = document.createElement('input'); i.type = 'color'; i.value = params.bgColor || '#0a0a0f'; i.onchange = () => update('bgColor', i.value); i.click() }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{(params.bgColor || '#0a0a0f').toUpperCase()}</span>
                </div>
              </div>
            </ControlSection>

            <ControlSection title="NEBULA">
              <div style={{ ...rowBase, paddingTop: 2 }}>
                <span style={rowLabel}>Enable</span>
                <ToggleSwitch checked={params.nebula.enabled} onChange={(v) => updateSection('nebula', 'enabled', v)} />
              </div>
              {params.nebula.enabled && (
                <>
                  <SliderControl label="Density" min={0.1} max={2} step={0.01} value={params.nebula.density} onChange={(v) => updateSection('nebula', 'density', v)} />
                  <SliderControl label="Opacity" min={0} max={1} step={0.01} value={params.nebula.opacity} onChange={(v) => updateSection('nebula', 'opacity', v)} />
                  <ColorControl label="Color 1" color={params.nebula.color1} onChange={(v) => updateSection('nebula', 'color1', v)} />
                  <ColorControl label="Color 2" color={params.nebula.color2} onChange={(v) => updateSection('nebula', 'color2', v)} />
                </>
              )}
            </ControlSection>

            <ControlSection title="STARFIELD">
              <div style={{ ...rowBase, paddingTop: 2 }}>
                <span style={rowLabel}>Enable</span>
                <ToggleSwitch checked={params.starfield.enabled} onChange={(v) => updateSection('starfield', 'enabled', v)} />
              </div>
              {params.starfield.enabled && (
                <>
                  <SliderControl label="Count" min={0} max={15000} step={100} value={params.starfield.count} onChange={(v) => updateSection('starfield', 'count', v)} />
                  <SliderControl label="Size" min={0.001} max={0.05} step={0.001} value={params.starfield.size} onChange={(v) => updateSection('starfield', 'size', v)} formatValue={(v) => v.toFixed(3)} />
                  <ColorControl label="Color" color={params.starfield.color} onChange={(v) => updateSection('starfield', 'color', v)} />
                </>
              )}
            </ControlSection>

            <ControlSection title="STARFALLS">
              <div style={{ ...rowBase, paddingTop: 2 }}>
                <span style={rowLabel}>Enable</span>
                <ToggleSwitch checked={params.starfalls.enabled} onChange={(v) => updateSection('starfalls', 'enabled', v)} />
              </div>
            </ControlSection>

            <div style={{ ...sectionBase, padding: '10px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Camera</span>
                <button onClick={handleResetCamera} style={{
                  padding: '4px 10px', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                }}>Reset</button>
              </div>
            </div>

            <ControlSection title="ANIMATION">
              <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-strong)', margin: '6px 16px' }}>
                {['Static', 'Orbit', 'Spin'].map((m) => (
                  <button key={m} onClick={() => updateSection('animation', 'mode', m)} style={{
                    flex: 1, padding: '5px 8px', border: 'none', fontSize: 11, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
                    background: params.animation.mode === m ? '#ffffff' : 'transparent',
                    color: params.animation.mode === m ? '#0e0e0e' : 'var(--text-muted)',
                    fontWeight: params.animation.mode === m ? 500 : 400,
                  }}>{m}</button>
                ))}
              </div>
              <SliderControl label="Speed" min={0} max={10} step={0.1} value={params.animation.speed} onChange={(v) => updateSection('animation', 'speed', v)} />
            </ControlSection>
          </>
        ) : (
          <>
            <div style={{ ...rowBase, paddingTop: 12 }}>
              <span style={rowLabel}>Enable</span>
              <ToggleSwitch checked={params.distant.enabled} onChange={(v) => updateSection('distant', 'enabled', v)} />
            </div>
            <ControlSection title="STRUCTURE">
              <SliderControl label="Stars" min={1000} max={100000} step={1000} value={params.distant.stars} onChange={(v) => updateSection('distant', 'stars', v)} />
              <SliderControl label="Radius" min={5} max={500} step={1} value={params.distant.radius} onChange={(v) => updateSection('distant', 'radius', v)} />
              <SliderControl label="Arms" min={1} max={10} step={1} value={params.distant.arms} onChange={(v) => updateSection('distant', 'arms', v)} />
            </ControlSection>
            <ControlSection title="DYNAMICS">
              <SliderControl label="Spin" min={0} max={5} step={0.01} value={params.distant.spin} onChange={(v) => updateSection('distant', 'spin', v)} />
              <SliderControl label="Scatter" min={0} max={5} step={0.01} value={params.distant.scatter} onChange={(v) => updateSection('distant', 'scatter', v)} />
              <SliderControl label="Speed" min={0} max={5} step={0.1} value={params.distant.speed} onChange={(v) => updateSection('distant', 'speed', v)} />
            </ControlSection>
            <ControlSection title="APPEARANCE">
              <SliderControl label="Size" min={0.01} max={2} step={0.01} value={params.distant.size} onChange={(v) => updateSection('distant', 'size', v)} />
              <ColorControl label="Inner" color={params.distant.innerColor} onChange={(v) => updateSection('distant', 'innerColor', v)} />
              <ColorControl label="Outer" color={params.distant.outerColor} onChange={(v) => updateSection('distant', 'outerColor', v)} />
            </ControlSection>
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 16px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={handleSave} style={{
            flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 500,
            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontFamily: 'inherit',
          }}>
            <IconSave size={11} />
            {saved ? 'Saved ✓' : 'Save'}
          </button>
          <button onClick={handleShareLink} style={{
            flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 500,
            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontFamily: 'inherit',
          }}>
            {linkCopied ? '✓ Copied' : 'Share'}
          </button>
          <button onClick={handleExportComponent} style={{
            flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 500,
            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            fontFamily: 'inherit',
          }}>
            <IconShuffle size={11} />
            React
          </button>
        </div>
        <button onClick={handleExport} style={{
          width: '100%', padding: '7px 0', fontSize: 11, fontWeight: 600,
          background: '#ffffff', border: 'none',
          borderRadius: 'var(--radius-md)', color: '#000', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: 'inherit',
        }}>
          <IconExport size={12} />
          Export
        </button>
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <label style={{ position: 'relative', width: 32, height: 18, flexShrink: 0 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
      <span style={{
        position: 'absolute', inset: 0, background: checked ? 'var(--accent)' : 'var(--bg-active)',
        borderRadius: 9, cursor: 'pointer', transition: 'background 0.15s',
      }}>
        <span style={{
          position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: 'white',
          top: 3, left: checked ? 17 : 3, transition: 'transform 0.15s',
        }} />
      </span>
    </label>
  )
}
