import { IconShuffle, IconPlay, IconPause, IconPanel } from '../icons/icons'
import styles from './Header.module.css'

export default function Header({ isPlaying, isPanelOpen, onTogglePlay, onTogglePanel, onShuffle }) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.star}>★</span> S T A R D U S T
      </div>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={onShuffle} title="Shuffle">
          <IconShuffle size={16} />
        </button>
        <button className={styles.btn} onClick={onTogglePlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <IconPause size={16} /> : <IconPlay size={16} />}
        </button>
        <button
          className={`${styles.btn} ${isPanelOpen ? styles.active : ''}`}
          onClick={onTogglePanel}
          title="Toggle Panel"
        >
          <IconPanel size={16} />
        </button>
      </div>
    </header>
  )
}
