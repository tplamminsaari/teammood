'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useTeamData } from '@/hooks/useTeamData'
import { DateNavigator } from './DateNavigator'
import { MoodBadge } from './MoodBadge'
import { ImageOverlay } from './ImageOverlay'
import { KebabMenu } from '@/components/KebabMenu/KebabMenu'
import { MOOD_EMOJIS } from '@/lib/types'
import type { MoodEntry } from '@/lib/types'
import { todayString, isToday } from '@/lib/dateUtils'
import styles from './TeamPage.module.css'

export function TeamPage() {
  const router = useRouter()
  const { user, ready } = useCurrentUser()
  const [date, setDate] = useState(todayString())
  const { entries, config, loading, newEntryIds, likeChangedIds, mutateEntries, mutateConfig, entriesError, entriesData } =
    useTeamData(date, user?.id ?? null)

  const [overlayEntry, setOverlayEntry] = useState<MoodEntry | null>(null)
  const [showConnectionError, setShowConnectionError] = useState(false)
  const successfulResponsesRef = useRef(0)

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

  // Monitor connection errors and show/hide banner
  useEffect(() => {
    if (entriesError) {
      // API returned an error, show the banner
      setShowConnectionError(true)
      successfulResponsesRef.current = 0 // Reset success counter
    } else if (!loading && entriesData) {
      // API succeeded, count this as a successful response
      successfulResponsesRef.current += 1
      
      // Hide banner after 3 consecutive successful responses (auto-recovery)
      if (successfulResponsesRef.current >= 3) {
        setShowConnectionError(false)
        successfulResponsesRef.current = 0
      }
    }
  }, [entriesError, loading, entriesData])

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

  async function handleLikeToggle(entryId: number) {
    if (!user) return

    // Optimistic update
    mutateEntries(
      (current: { entries: MoodEntry[] } | undefined) => {
        if (!current) return current
        return {
          entries: current.entries.map(e =>
            e.id === entryId
              ? { ...e, likedByMe: !e.likedByMe, likeCount: e.likedByMe ? e.likeCount - 1 : e.likeCount + 1 }
              : e
          ),
        }
      },
      { revalidate: false }
    )

    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, userId: user.id }),
      })
    } catch {
      // Revert on error by revalidating
      mutateEntries()
    }
  }

  return (
    <div className={styles.page}>
      {showConnectionError && (
        <div className={styles.connectionBanner}>
          ⚠️ Database connection lost — some features may not work properly
        </div>
      )}
      <header className={styles.header}>
        <span className={styles.appName}>Mood</span>

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
        {!loading && entries.length === 0 ? (
          <div className={styles.empty}>No moods submitted for this day.</div>
        ) : (
          <div className={styles.grid}>
            {entries.map(entry => (
              <MoodBadge
                key={entry.id}
                entry={entry}
                isNew={newEntryIds.has(entry.id)}
                likeChanged={likeChangedIds.has(entry.id)}
                isToday={viewing}
                onLikeToggle={handleLikeToggle}
                onImageClick={setOverlayEntry}
              />
            ))}
          </div>
        )}
      </main>

      {viewing && (
        <button className={styles.fab} onClick={() => router.push('/mood')} aria-label="Submit mood">
          +
        </button>
      )}

      {overlayEntry && (
        <ImageOverlay entry={overlayEntry} onClose={() => setOverlayEntry(null)} />
      )}
    </div>
  )
}
