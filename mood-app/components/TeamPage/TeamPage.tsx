'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTeamData } from '@/hooks/useTeamData'
import { DateNavigator } from './DateNavigator'
import { KebabMenu } from '@/components/KebabMenu/KebabMenu'
import { MOOD_EMOJIS } from '@/lib/types'
import { todayString, isToday } from '@/lib/dateUtils'
import styles from './TeamPage.module.css'

export function TeamPage() {
  const router = useRouter()
  const { user, ready } = useCurrentUser()
  const [date, setDate] = useState(todayString())
  const { entries, config, loading, mutateConfig } = useTeamData(date, user?.id ?? null)

  // Sprint name local edit state
  const [sprintName, setSprintName] = useState('')
  const savedSprintName = useRef('')
  const isEditingSprint = useRef(false)

  // Sync sprint name from polling (only when not actively editing)
  useEffect(() => {
    if (!isEditingSprint.current) {
      setSprintName(config.sprintName)
      savedSprintName.current = config.sprintName
    }
  }, [config.sprintName])

  // Route guard — redirect to welcome if no user
  useEffect(() => {
    if (ready && !user) router.replace('/')
  }, [ready, user, router])

  if (!ready || !user) return null

  const viewing = isToday(date)
  const avgMood =
    entries.length > 0
      ? (entries.reduce((s, e) => s + e.moodRating, 0) / entries.length).toFixed(1)
      : null

  async function saveSprintName(value: string) {
    await fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, sprintName: value }),
    })
    mutateConfig()
  }

  function handleSprintBlur() {
    isEditingSprint.current = false
    if (sprintName !== savedSprintName.current) {
      saveSprintName(sprintName)
      savedSprintName.current = sprintName
    }
  }

  function handleSprintKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
    if (e.key === 'Escape') {
      setSprintName(savedSprintName.current)
      isEditingSprint.current = false
      e.currentTarget.blur()
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.appName}>Teammood</span>

        <DateNavigator date={date} onChange={setDate} />

        <input
          className={styles.sprintName}
          value={sprintName}
          placeholder={viewing ? 'Add sprint name…' : ''}
          readOnly={!viewing}
          onChange={e => {
            isEditingSprint.current = true
            setSprintName(e.target.value)
          }}
          onBlur={handleSprintBlur}
          onKeyDown={handleSprintKeyDown}
          maxLength={200}
        />

        {avgMood && (
          <span className={styles.avgMood}>
            Avg {avgMood} {MOOD_EMOJIS[Math.round(Number(avgMood))]}
          </span>
        )}

        <KebabMenu />
      </header>

      <main className={styles.content}>
        {loading && entries.length === 0 ? null : entries.length === 0 ? (
          <div className={styles.empty}>No moods submitted for this day.</div>
        ) : (
          <div className={styles.grid}>
            {entries.map(entry => (
              // Placeholder — replaced by MoodBadge in T17
              <div key={entry.id} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}>
                <strong>{entry.userName}</strong> — {entry.moodRating} {MOOD_EMOJIS[entry.moodRating]}
                {entry.hasTrophy && ' 🏆'}
              </div>
            ))}
          </div>
        )}
      </main>

      {viewing && (
        <button className={styles.fab} onClick={() => router.push('/mood')} aria-label="Submit mood">
          +
        </button>
      )}
    </div>
  )
}
