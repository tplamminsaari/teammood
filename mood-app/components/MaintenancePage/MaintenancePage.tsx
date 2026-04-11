'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './MaintenancePage.module.css'

interface Stats {
  userCount: number
  entryCount: number
  daysWithEntries: number
  imageDataCount: number
}

interface OpState {
  date: string
  preview: string | null
  success: string | null
  loading: boolean
}

function useOp() {
  return useState<OpState>({ date: '', preview: null, success: null, loading: false })
}

export function MaintenancePage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)

  const [resetToday, setResetToday] = useOp()
  const [entries, setEntries] = useOp()
  const [images, setImages] = useOp()
  const [users, setUsers] = useOp()

  async function loadStats() {
    const res = await fetch('/api/maintenance')
    const data = await res.json()
    setStats(data)
  }

  useEffect(() => { loadStats() }, [])

  async function preview(op: string, params: Record<string, string>) {
    const qs = new URLSearchParams({ op, ...params, dryRun: '1' }).toString()
    const res = await fetch(`/api/maintenance?${qs}`, { method: 'DELETE' })
    const data = await res.json()
    return data.deletedCount as number
  }

  async function confirm(op: string, params: Record<string, string>) {
    const qs = new URLSearchParams({ op, ...params }).toString()
    const res = await fetch(`/api/maintenance?${qs}`, { method: 'DELETE' })
    const data = await res.json()
    return data.deletedCount as number
  }

  async function handlePreview(
    op: string,
    params: Record<string, string>,
    set: React.Dispatch<React.SetStateAction<OpState>>
  ) {
    set(s => ({ ...s, loading: true, preview: null, success: null }))
    const count = await preview(op, params)
    set(s => ({ ...s, loading: false, preview: `Found ${count} record(s) to remove.` }))
  }

  async function handleConfirm(
    op: string,
    params: Record<string, string>,
    set: React.Dispatch<React.SetStateAction<OpState>>
  ) {
    set(s => ({ ...s, loading: true }))
    const count = await confirm(op, params)
    set(s => ({ ...s, loading: false, preview: null, success: `Removed ${count} record(s).` }))
    loadStats()
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          ← Back
        </button>

        <h1 className={styles.title}>Maintenance</h1>

        {/* Stats */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.userCount}</span>
              <span className={styles.statLabel}>Registered users</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.entryCount}</span>
              <span className={styles.statLabel}>Mood entries</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.daysWithEntries}</span>
              <span className={styles.statLabel}>Days with entries</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{stats.imageDataCount}</span>
              <span className={styles.statLabel}>Entries with images</span>
            </div>
          </div>
        )}

        <div className={styles.ops}>
          {/* Reset today */}
          <div className={styles.opCard}>
            <div className={styles.opTitle}>Reset today</div>
            <div className={styles.opDesc}>Removes all mood entries for today. Useful for restarting a session.</div>
            <div className={styles.opRow}>
              <button
                className={styles.previewBtn}
                disabled={resetToday.loading}
                onClick={() => handlePreview('reset-today', {}, setResetToday)}
              >
                Preview
              </button>
              {resetToday.preview && (
                <>
                  <span className={styles.preview}>{resetToday.preview}</span>
                  <button
                    className={styles.confirmBtn}
                    disabled={resetToday.loading}
                    onClick={() => handleConfirm('reset-today', {}, setResetToday)}
                  >
                    Confirm
                  </button>
                </>
              )}
              {resetToday.success && <span className={styles.successMsg}>{resetToday.success}</span>}
            </div>
          </div>

          {/* Remove entries older than */}
          <div className={styles.opCard}>
            <div className={styles.opTitle}>Remove mood entries before date</div>
            <div className={styles.opDesc}>Deletes all mood entries (including images) before the selected date.</div>
            <div className={styles.opRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={entries.date}
                onChange={e => setEntries(s => ({ ...s, date: e.target.value, preview: null, success: null }))}
              />
              <button
                className={styles.previewBtn}
                disabled={!entries.date || entries.loading}
                onClick={() => handlePreview('entries', { before: entries.date }, setEntries)}
              >
                Preview
              </button>
              {entries.preview && (
                <>
                  <span className={styles.preview}>{entries.preview}</span>
                  <button
                    className={styles.confirmBtn}
                    disabled={entries.loading}
                    onClick={() => handleConfirm('entries', { before: entries.date }, setEntries)}
                  >
                    Confirm
                  </button>
                </>
              )}
              {entries.success && <span className={styles.successMsg}>{entries.success}</span>}
            </div>
          </div>

          {/* Remove image data older than */}
          <div className={styles.opCard}>
            <div className={styles.opTitle}>Remove image data before date</div>
            <div className={styles.opDesc}>Clears stored images but keeps mood ratings and names.</div>
            <div className={styles.opRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={images.date}
                onChange={e => setImages(s => ({ ...s, date: e.target.value, preview: null, success: null }))}
              />
              <button
                className={styles.previewBtn}
                disabled={!images.date || images.loading}
                onClick={() => handlePreview('images', { before: images.date }, setImages)}
              >
                Preview
              </button>
              {images.preview && (
                <>
                  <span className={styles.preview}>{images.preview}</span>
                  <button
                    className={styles.confirmBtn}
                    disabled={images.loading}
                    onClick={() => handleConfirm('images', { before: images.date }, setImages)}
                  >
                    Confirm
                  </button>
                </>
              )}
              {images.success && <span className={styles.successMsg}>{images.success}</span>}
            </div>
          </div>

          {/* Remove inactive users */}
          <div className={styles.opCard}>
            <div className={styles.opTitle}>Remove users inactive since date</div>
            <div className={styles.opDesc}>Removes users who have not been active since the selected date. Their historical entries remain.</div>
            <div className={styles.opRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={users.date}
                onChange={e => setUsers(s => ({ ...s, date: e.target.value, preview: null, success: null }))}
              />
              <button
                className={styles.previewBtn}
                disabled={!users.date || users.loading}
                onClick={() => handlePreview('users', { inactiveSince: users.date }, setUsers)}
              >
                Preview
              </button>
              {users.preview && (
                <>
                  <span className={styles.preview}>{users.preview}</span>
                  <button
                    className={styles.confirmBtn}
                    disabled={users.loading}
                    onClick={() => handleConfirm('users', { inactiveSince: users.date }, setUsers)}
                  >
                    Confirm
                  </button>
                </>
              )}
              {users.success && <span className={styles.successMsg}>{users.success}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
