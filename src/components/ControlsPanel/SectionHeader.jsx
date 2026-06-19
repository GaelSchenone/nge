import { IconChevronDown, IconChevronUp } from '../icons/icons'

export default function SectionHeader({ label, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '6px 0',
        border: 'none',
        background: 'none',
        color: '#6b6b80',
        fontSize: '0.65rem',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <span>{label}</span>
      {isOpen ? <IconChevronUp size={10} /> : <IconChevronDown size={10} />}
    </button>
  )
}
