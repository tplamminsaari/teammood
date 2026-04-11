'use client'

import { useEffect } from 'react'
import type { MoodEntry } from '@/lib/types'
import styles from './ImageOverlay.module.css'

interface Props {
  entry: MoodEntry
  onClose: () => void
}

export function ImageOverlay({ entry, onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
          ✕
        </button>

        {entry.imageData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.imageData}
            alt={`${entry.userName}'s drawing`}
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder} />
        )}

        <div className={styles.name}>{entry.userName}</div>
      </div>
    </div>
  )
}
