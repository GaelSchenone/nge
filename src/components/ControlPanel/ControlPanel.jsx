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
    const MAIN_WORKER_SRC = `self.onmessage=function({data}){
const{stars,radius,arms,spin,scatter,density,size,innerColor,outerColor}=data
function h2r(h){const v=parseInt(h.slice(1),16);return{r:((v>>16)&255)/255,g:((v>>8)&255)/255,b:(v&255)/255}}
const i=h2r(innerColor),o=h2r(outerColor)
const p=new Float32Array(stars*3),c=new Float32Array(stars*3),s=new Float32Array(stars)
for(let n=0;n<stars;n++){
  const a=n%arms,ai=a/arms*Math.PI*2,td=Math.pow(Math.random(),density),r=td*radius
  const ang=ai+spin*r+(Math.random()-.5)*scatter*(1+r*.4),noi=scatter*r*.12,hf=.08+scatter*.18
  p[n*3]=Math.cos(ang)*r+(Math.random()-.5)*noi
  p[n*3+1]=(Math.random()-.5)*r*hf;p[n*3+2]=Math.sin(ang)*r+(Math.random()-.5)*noi
  const mr=i.r+(o.r-i.r)*td,mg=i.g+(o.g-i.g)*td,mb=i.b+(o.b-i.b)*td
  c[n*3]=mr;c[n*3+1]=mg;c[n*3+2]=mb
  s[n]=size*(.5+(1-td)*1.5)*(.8+Math.random()*.4)
}
self.postMessage({_target:'main',positions:p,colors:c,sizes:s},[p.buffer,c.buffer,s.buffer])}`
    const DIST_WORKER_SRC = MAIN_WORKER_SRC.replace("'main'", "'distant'")

    const code = `import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// Background component — no OrbitControls needed

const VP=\`attribute float aSize;attribute vec3 aColor;varying vec3 vColor;
void main(){vColor=aColor;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_PointSize=aSize*(5000.0/-mvPosition.z);gl_Position=projectionMatrix*mvPosition;}\`
const FP=\`varying vec3 vColor;
void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>.5)discard;float alpha=smoothstep(.5,.0,d);gl_FragColor=vec4(vColor,alpha);}\`

const P=${JSON.stringify(params)}

// Inline worker sources — created at runtime so blob origin always matches
const MAIN_WORKER_SRC = ${JSON.stringify(MAIN_WORKER_SRC)}
const DIST_WORKER_SRC = MAIN_WORKER_SRC.replace(/'main'/, "'distant'")

function makeWorker(src) {
  return new Worker(URL.createObjectURL(new Blob([src], { type: 'application/javascript' })))
}

export default function GalaxyBG({style,className}){
  const ref=useRef(null)
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const w=el.clientWidth,h=el.clientHeight
    const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})
    r.setPixelRatio(Math.min(devicePixelRatio,2));r.setSize(w,h)
    r.setClearColor(new THREE.Color(P.bgColor||'#0a0a0f'),1)
    el.appendChild(r.domElement)
    const ro=new ResizeObserver(([e])=>{
      const w2=e.contentRect.width,h2=e.contentRect.height
      if(w2&&h2){r.setSize(w2,h2);cam.aspect=w2/h2;cam.updateProjectionMatrix()}
    })
    ro.observe(el)
    const s=new THREE.Scene()
    const cam=new THREE.PerspectiveCamera(60,w/h,0.1,1e4)
    cam.position.set(0,6,14);cam.lookAt(0,0,0)
    const mouse={x:0,y:0}
    const onMouse=(e)=>{const ww=window.innerWidth,wh=window.innerHeight;mouse.x=(e.clientX/ww-.5)*2;mouse.y=(e.clientY/wh-.5)*2}
    window.addEventListener('mousemove',onMouse)
    const gg=new THREE.Group();s.add(gg)
    const dg=new THREE.Group();dg.position.z=-200;dg.rotation.x=.4;s.add(dg)
    // Main galaxy worker (inline, no origin-locked blob)
    const wkm=makeWorker(MAIN_WORKER_SRC)
    wkm.onmessage=({data})=>{
      const{positions,colors,sizes}=data
      const g=new THREE.BufferGeometry()
      g.setAttribute('position',new THREE.BufferAttribute(positions,3))
      g.setAttribute('aColor',new THREE.BufferAttribute(colors,3))
      g.setAttribute('aSize',new THREE.BufferAttribute(sizes,1))
      const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:VP,fragmentShader:FP})
      gg.add(new THREE.Points(g,m))
    }
    wkm.postMessage({stars:P.stars,radius:P.radius,arms:P.arms,spin:P.spin,scatter:P.scatter,density:P.density,size:P.size,innerColor:P.innerColor,outerColor:P.outerColor})
    // Distant galaxy worker
    if(P.distant?.enabled){
      const wkd=makeWorker(DIST_WORKER_SRC)
      wkd.onmessage=({data})=>{
        const{positions,colors,sizes}=data
        const g=new THREE.BufferGeometry()
        g.setAttribute('position',new THREE.BufferAttribute(positions,3))
        g.setAttribute('aColor',new THREE.BufferAttribute(colors,3))
        g.setAttribute('aSize',new THREE.BufferAttribute(sizes,1))
        const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:VP,fragmentShader:FP})
        dg.add(new THREE.Points(g,m))
      }
      wkd.postMessage({stars:P.distant.stars,radius:P.distant.radius,arms:P.distant.arms,spin:P.distant.spin,scatter:P.distant.scatter,density:2.8,size:P.distant.size,innerColor:P.distant.innerColor,outerColor:P.distant.outerColor})
    }
    // Starfield
    if(P.starfield?.enabled){
      const dc=document.createElement('canvas');dc.width=32;dc.height=32
      const dctx=dc.getContext('2d')
      const dgrd=dctx.createRadialGradient(16,16,0,16,16,16)
      dgrd.addColorStop(0,'rgba(255,255,255,1)');dgrd.addColorStop(.3,'rgba(255,255,255,.8)');dgrd.addColorStop(1,'rgba(255,255,255,0)')
      dctx.fillStyle=dgrd;dctx.fillRect(0,0,32,32)
      const dt=new THREE.CanvasTexture(dc);dt.needsUpdate=true
      const cnt=P.starfield.count||5000
      const pos=new Float32Array(cnt*3)
      for(let i=0;i<cnt;i++){const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),rad=60+Math.cbrt(Math.random())*440;pos[i*3]=rad*Math.sin(ph)*Math.cos(th);pos[i*3+1]=rad*Math.sin(ph)*Math.sin(th);pos[i*3+2]=rad*Math.cos(ph)}
      const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3))
      const sm=new THREE.PointsMaterial({color:P.starfield.color||'#fff',map:dt,size:(P.starfield.size||.015)*150,transparent:true,opacity:.9,depthWrite:false,sizeAttenuation:true})
      const sf=new THREE.Points(sg,sm);sf.frustumCulled=false;s.add(sf)
    }
    // Nebula
    if(P.nebula?.enabled){
      const nc=document.createElement('canvas');nc.width=512;nc.height=512
      const nctx=nc.getContext('2d')
      const ng=nctx.createRadialGradient(256,256,0,256,256,256)
      ng.addColorStop(0,'rgba(255,255,255,1)');ng.addColorStop(.15,'rgba(255,255,255,.7)');ng.addColorStop(1,'rgba(255,255,255,0)')
      nctx.fillStyle=ng;nctx.fillRect(0,0,512,512)
      const nt=new THREE.CanvasTexture(nc);nt.needsUpdate=true
      for(let i=0;i<8;i++){
        const ai=Math.floor(Math.random()*P.arms),ao=ai/P.arms*Math.PI*2,td=.3+Math.random()*.6,rr=td*P.radius
        const ang=ao+P.spin*rr+(Math.random()-.5)*P.scatter,noi=P.scatter*rr*.12
        const x=Math.cos(ang)*rr+(Math.random()-.5)*noi,z=Math.sin(ang)*rr+(Math.random()-.5)*noi,y=(Math.random()-.5)*rr*.06
        const col=Math.random()>.5?P.nebula.color1:P.nebula.color2
        const nmat=new THREE.SpriteMaterial({map:nt,color:col,transparent:true,opacity:P.nebula.opacity||.4,blending:THREE.AdditiveBlending,depthWrite:false})
        const sp=new THREE.Sprite(nmat);sp.position.set(x,y,z);const sc=(P.nebula.density||.7)*P.radius*.8;sp.scale.set(sc,sc,1);gg.add(sp)
      }
    }
    // Animation
    let lt=0;let lastSpawn=0;let px=0;let py=0;const falls=[]
    function anim(t){
      requestAnimationFrame(anim)
      const dt=lt?Math.min(t-lt,50)/16:1;lt=t
      // no controls
      if(P.distant?.enabled) dg.rotation.y+=P.distant.speed*.0001*dt
      if(P.animation?.spin) gg.rotation.y+=.0002*(P.animation.speed||1)*dt
      const maxP=.04;const pp=.03
      if(P.animation?.parallax){
        const tx=mouse.x*maxP,ty=mouse.y*maxP
        px+=(ty-px)*pp;py+=(tx-py)*pp
      }else{px*=.95;py*=.95}
      if(P.animation?.scroll&&typeof window!=='undefined'){
        const sm=Math.max(1,(document.documentElement.scrollHeight||1)-window.innerHeight)
        const pr=(window.scrollY||document.documentElement.scrollTop||0)/sm
        gg.rotation.x=-pr*.15+px
      }else{gg.rotation.x=px}
      if(P.starfalls?.enabled&&Date.now()-lastSpawn>800&&falls.length<12){
        lastSpawn=Date.now()
        const th=Math.random()*Math.PI*2,ph=Math.acos(2*Math.random()-1),rad=10+Math.random()*4
        const sx=rad*Math.sin(ph)*Math.cos(th),sy=rad*Math.sin(ph)*Math.sin(th),sz=rad*Math.cos(ph)
        const seg=30;const sp2=new Float32Array(seg*3)
        const sg2=new THREE.BufferGeometry();sg2.setAttribute('position',new THREE.BufferAttribute(sp2,3))
        const lm=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:1,blending:THREE.AdditiveBlending})
        const ln=new THREE.Line(sg2,lm);s.add(ln)
        falls.push({line:ln,start:Date.now(),dur:1200})
      }
      for(let si=falls.length-1;si>=0;si--){
        const f=falls[si],prog=Math.min((Date.now()-f.start)/f.dur,1)
        f.line.material.opacity=Math.max(0,1-prog*1.2)
        if(prog>=1){s.remove(f.line);f.line.geometry.dispose();f.line.material.dispose();falls.splice(si,1)}
      }
      r.render(s,cam)
    }
    requestAnimationFrame(anim)
    return()=>{ro.disconnect();r.dispose();wkm.terminate();r.domElement.remove();window.removeEventListener('mousemove',onMouse)}
  },[])
  return<div ref={ref} style={{position:'fixed',inset:0,overflow:'hidden',...style}} className={className}/>
}`
    const blob = new Blob([code], { type: 'text/jsx' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = 'GalaxyBackground.jsx'
    link.href = url; link.click()
    URL.revokeObjectURL(url)
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 16px' }}>
                <CheckRow label="Parallax" checked={params.animation.parallax} onChange={(v) => updateSection('animation', 'parallax', v)} />
                <CheckRow label="Spin" checked={params.animation.spin} onChange={(v) => updateSection('animation', 'spin', v)} />
                <CheckRow label="Scroll" checked={params.animation.scroll} onChange={(v) => updateSection('animation', 'scroll', v)} />
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

function CheckRow({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '2px 0' }}>
      <span style={{
        position: 'relative', width: 14, height: 14, flexShrink: 0,
        background: checked ? 'var(--accent)' : 'var(--bg-active)',
        borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
    </label>
  )
}
