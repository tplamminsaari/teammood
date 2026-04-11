import { MOOD_EMOJIS } from '@/lib/types'
import styles from './MoodSelector.module.css'

interface Props {
  value: number | null
  onChange: (mood: number) => void
}

export function MoodSelector({ value, onChange }: Props) {
  return (
    <div className={styles.selector}>
      {[1, 2, 3, 4, 5].map(mood => {
        const isSelected = value === mood
        const selectedClass = isSelected ? styles[`selected-${mood}` as keyof typeof styles] : ''
        return (
          <button
            key={mood}
            type="button"
            className={`${styles.btn} ${selectedClass}`}
            onClick={() => onChange(mood)}
            aria-label={`Mood ${mood}`}
            aria-pressed={isSelected}
          >
            <span className={styles.emoji}>{MOOD_EMOJIS[mood]}</span>
            <span className={styles.number}>{mood}</span>
          </button>
        )
      })}
    </div>
  )
}
