import { useState, useCallback } from 'react'
import ToggleGroup from './ToggleGroup'
import { IconX, IconDownload, IconCheck } from '../icons/icons'

const FORMATS = [
  { value: 'PNG', label: 'PNG' },
  { value: 'GIF', label: 'GIF' },
  { value: 'WebM', label: 'WebM' },
  { value: 'MP4', label: 'MP4' },
]

const ASPECTS = [
  { value: '16:9', label: '16:9' },
  { value: '1:1', label: '1:1' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
]

const RESOLUTIONS = [
  { label: '720p', size: '1280×720' },
  { label: '1080p', size: '1920×1080' },
  { label: '2K', size: '2560×1440' },
  { label: '4K', size: '3840×2160' },
]

export default function ExportModal({ open, onClose, canvasRef }) {
  const [format, setFormat] = useState('PNG')
  const [aspect, setAspect] = useState('16:9')
  const [resolution, setResolution] = useState('1080p')
  const [transparent, setTransparent] = useState(false)

  const handleDownload = useCallback(() => {
    const c = canvasRef?.current
    const el = c?.canvas ?? c
    if (!el) return
    el.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `nge-galaxy.${format.toLowerCase()}`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [canvasRef, format])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        maxWidth: 580, width: '90%',
        maxHeight: '90vh', overflowY: 'auto',
        padding: 24,
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>Export</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', padding: 4, borderRadius: 'var(--radius-sm)',
          }}>
            <IconX size={16} />
          </button>
        </div>

        {/* Preview placeholder */}
        <div style={{
          width: '100%', aspectRatio: '16 / 9',
          background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)',
          marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: 11, border: '1px solid var(--border)',
        }}>
          Galaxy Preview
        </div>

        {/* Format */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Format</span>
          <ToggleGroup options={FORMATS} value={format} onChange={setFormat} />
        </div>

        {/* Aspect */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Size</span>
          <ToggleGroup options={ASPECTS} value={aspect} onChange={setAspect} />
        </div>

        {/* Resolution */}
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Resolution</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {RESOLUTIONS.map((r) => (
              <button key={r.label} onClick={() => setResolution(r.label)} style={{
                padding: '10px 12px', background: resolution === r.label ? 'var(--accent-dim)' : 'var(--bg-surface)',
                border: resolution === r.label ? '1px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
                transition: 'border-color 0.1s',
              }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, display: 'block',
                  color: resolution === r.label ? 'var(--accent)' : 'var(--text-primary)',
                }}>{r.label}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>{r.size}</span>
              </button>
            ))}
            <button style={{
              padding: '10px 12px', background: 'var(--bg-surface)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', textAlign: 'left', gridColumn: '1 / -1',
            }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>⚙ Custom</span>
            </button>
          </div>
        </div>

        {/* Transparent toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <label style={{ position: 'relative', width: 32, height: 18, flexShrink: 0 }}>
            <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
            <span style={{
              position: 'absolute', inset: 0,
              background: transparent ? 'var(--accent)' : 'var(--bg-active)',
              borderRadius: 9, cursor: 'pointer', transition: 'background 0.15s',
            }}>
              <span style={{
                position: 'absolute', width: 12, height: 12, borderRadius: '50%', background: 'white',
                top: 3, left: transparent ? 17 : 3, transition: 'transform 0.15s',
              }} />
            </span>
          </label>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Transparent background</span>
        </div>

        {/* Footer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <button onClick={handleDownload} style={{
            padding: 10, fontSize: 12, fontWeight: 500,
            background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
          }}>
            <IconDownload size={14} />
            Download
          </button>
          <button style={{
            padding: 10, fontSize: 12, fontWeight: 600,
            background: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)',
            color: '#000', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit',
          }}>
            <IconCheck size={14} />
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  )
}
