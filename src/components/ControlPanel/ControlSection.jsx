import { useState } from 'react'
import { IconChevronDown, IconChevronUp } from '../icons/icons'

const styles = {
  section: {
    borderBottom: '1px solid var(--border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-secondary)',
    fontFamily: 'inherit',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    transition: 'color 0.15s',
  },
  body: {
    paddingBottom: 4,
  },
}

export default function ControlSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={styles.section}>
      <button
        style={styles.header}
        onClick={() => setOpen(!open)}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <span>{title}</span>
        {open ? <IconChevronUp size={10} /> : <IconChevronDown size={10} />}
      </button>
      {open && <div style={styles.body}>{children}</div>}
    </div>
  )
}
