'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { MoodSelector } from './MoodSelector'
import { DrawingCanvas, DrawingCanvasHandle } from './DrawingCanvas'
import { todayString, formatTime } from '@/lib/dateUtils'
import type { MoodEntry } from '@/lib/types'
import styles from './MoodPage.module.css'

export function MoodPage() {
  const router = useRouter()
  const { user, ready } = useCurrentUser()

  const [mood, setMood] = useState<number | null>(null)
  const [hasTrophy, setHasTrophy] = useState(false)
  const [existingEntry, setExistingEntry] = useState<MoodEntry | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Toolbar state lifted here so MoodPage owns it
  const [brushSize, setBrushSize] = useState(8)
  const [brushShape, setBrushShape] = useState<'round' | 'square'>('round')
  const [color, setColor] = useState('#000000')

  const canvasRef = useRef<DrawingCanvasHandle>(null)

  // Route guard
  useEffect(() => {
    if (ready && !user) router.replace('/')
  }, [ready, user, router])

  // T16: Load today's existing submission if any
  useEffect(() => {
    if (!user) return
    fetch(`/api/entries?date=${todayString()}&userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        const entry: MoodEntry | undefined = data.entries?.find(
          (e: MoodEntry) => e.userId === user.id
        )
        if (entry) {
          setExistingEntry(entry)
          setMood(entry.moodRating)
          setHasTrophy(entry.hasTrophy)
          if (entry.imageData) {
            canvasRef.current?.loadImage(entry.imageData)
          }
        }
      })
      .catch(() => {})
  }, [user])

  if (!ready || !user) return null

  async function handleContinue() {
    if (!mood || !user) return
    setSubmitting(true)
    setError('')

    const imageData = canvasRef.current?.toDataURL() ?? null

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, moodRating: mood, imageData, hasTrophy }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Submission failed')
        return
      }
      router.push('/team')
    } catch {
      setError('Could not connect to the server')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.greeting}>Hi {user.name}! How are you feeling today?</h1>

        {existingEntry && (
          <div className={styles.alreadySubmitted}>
            Already submitted today at {formatTime(existingEntry.submittedAt)} — you can update it below.
          </div>
        )}

        <div className={styles.section}>
          <MoodSelector value={mood} onChange={setMood} />
          <label className={styles.trophyRow}>
            <input
              type="checkbox"
              checked={hasTrophy}
              onChange={e => setHasTrophy(e.target.checked)}
            />
            I have the trophy 🏆
          </label>
        </div>

        <div className={styles.section}>
          <span className={styles.label}>Drawing</span>
          <DrawingCanvas
            ref={canvasRef}
            brushSize={brushSize}
            brushShape={brushShape}
            color={color}
            onBrushSizeChange={setBrushSize}
            onBrushShapeChange={setBrushShape}
            onColorChange={setColor}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => router.push('/team')}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.continueBtn}
            disabled={!mood || submitting}
            onClick={handleContinue}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}
