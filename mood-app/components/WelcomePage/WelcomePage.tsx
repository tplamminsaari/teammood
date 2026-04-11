'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { KebabMenu } from '@/components/KebabMenu/KebabMenu'
import type { User } from '@/lib/types'
import styles from './WelcomePage.module.css'

export function WelcomePage() {
  const router = useRouter()
  const { user, ready, setUser } = useCurrentUser()
  const [name, setName] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Pre-fill name from localStorage once ready
  useEffect(() => {
    if (ready && user) {
      setName(user.name)
    }
  }, [ready, user])

  // Focus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Fetch existing users for the chips
  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setUsers(data.users ?? []))
      .catch(() => {})
  }, [])

  async function handleJoin() {
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
        return
      }

      setUser(data.user.id, data.user.name)
      router.push('/team')
    } catch {
      setError('Could not connect to the server')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleJoin()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <KebabMenu />
      </div>

      <div className={styles.card}>
        <div className={styles.appName}>Teammood</div>
        <h1 className={styles.heading}>What&apos;s your mood today?</h1>

        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={styles.nameInput}
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={100}
          />
          <button
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={!name.trim() || loading}
          >
            {loading ? '…' : 'Join'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {users.length > 0 && (
          <div>
            <div className={styles.chipsLabel}>Previously used names</div>
            <div className={styles.chips} style={{ marginTop: 8 }}>
              {users.map(u => (
                <button
                  key={u.id}
                  className={styles.chip}
                  onClick={() => {
                    setName(u.name)
                    inputRef.current?.focus()
                  }}
                >
                  {u.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
