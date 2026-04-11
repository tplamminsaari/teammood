'use client'

import { useState, useEffect } from 'react'
import { MOOD_EMOJIS } from '@/lib/types'
import type { MoodEntry } from '@/lib/types'
import styles from './MoodBadge.module.css'

interface Props {
  entry: MoodEntry
  isNew: boolean
  likeChanged: boolean
  isToday: boolean
  onLikeToggle: (entryId: number) => void
  onImageClick: (entry: MoodEntry) => void
}

export function MoodBadge({ entry, isNew, likeChanged, isToday, onLikeToggle, onImageClick }: Props) {
  const [popHeart, setPopHeart] = useState(false)

  useEffect(() => {
    if (likeChanged) {
      setPopHeart(true)
      const t = setTimeout(() => setPopHeart(false), 400)
      return () => clearTimeout(t)
    }
  }, [likeChanged, entry.likeCount])

  return (
    <div className={`${styles.badge} ${isNew ? styles.fadeIn : ''}`}>
      <div className={styles.imageArea} onClick={() => onImageClick(entry)}>
        {entry.imageData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.imageData} alt={`${entry.userName}'s drawing`} className={styles.image} />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}

        {/* Like — bottom-left */}
        <div className={styles.likeCorner} onClick={e => e.stopPropagation()}>
          <button
            className={`${styles.heartBtn} ${popHeart ? styles.likePop : ''}`}
            disabled={!isToday}
            onClick={() => onLikeToggle(entry.id)}
            aria-label={entry.likedByMe ? 'Unlike' : 'Like'}
          >
            {entry.likedByMe ? '❤️' : '🤍'}
          </button>
          <span className={styles.likeCount}>{entry.likeCount}</span>
        </div>

        {/* Trophy — bottom-right */}
        {entry.hasTrophy && (
          <div className={styles.trophyCorner}>🏆</div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.name}>{entry.userName}</div>
        <div className={styles.moodRow}>
          <span>{entry.moodRating}</span>
          <span>{MOOD_EMOJIS[entry.moodRating]}</span>
        </div>
      </div>
    </div>
  )
}
