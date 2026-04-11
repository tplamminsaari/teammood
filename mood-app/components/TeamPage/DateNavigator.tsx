'use client'

import { useRef } from 'react'
import { addDays, formatDisplayDate, isToday, isFuture, todayString } from '@/lib/dateUtils'
import styles from './DateNavigator.module.css'

interface Props {
  date: string
  onChange: (date: string) => void
}

export function DateNavigator({ date, onChange }: Props) {
  const nextDate = addDays(date, 1)
  const canGoNext = !isFuture(nextDate)
  const dateInputRef = useRef<HTMLInputElement>(null)

  function handleDateInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (!val || isFuture(val)) {
      onChange(todayString())
    } else {
      onChange(val)
    }
  }

  return (
    <div className={styles.navigator}>
      <button
        className={styles.arrow}
        onClick={() => onChange(addDays(date, -1))}
        aria-label="Previous day"
      >
        ‹
      </button>

      <div className={styles.dateWrapper} onClick={() => dateInputRef.current?.showPicker()}>
        <span className={styles.dateLabel}>{formatDisplayDate(date)}</span>
        <input
          ref={dateInputRef}
          type="date"
          value={date}
          max={todayString()}
          onChange={handleDateInput}
          className={styles.hiddenInput}
          aria-label="Select date"
        />
      </div>

      <button
        className={styles.arrow}
        onClick={() => onChange(nextDate)}
        disabled={!canGoNext}
        aria-label="Next day"
      >
        ›
      </button>

      {!isToday(date) && (
        <button className={styles.todayBtn} onClick={() => onChange(todayString())}>
          Today
        </button>
      )}
    </div>
  )
}
