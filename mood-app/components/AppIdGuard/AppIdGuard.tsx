'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './AppIdGuard.module.css'

const SESSION_KEY = 'appid'

export function AppIdGuard({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'pending' | 'valid' | 'invalid'>('pending')

  useEffect(() => {
    async function validate() {
      // Already validated in this session
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored) {
        const res = await fetch(`/api/appid?id=${encodeURIComponent(stored)}`)
        const data = await res.json()
        if (data.valid) {
          setStatus('valid')
          return
        }
        sessionStorage.removeItem(SESSION_KEY)
      }

      // Try the query param
      const paramId = searchParams.get('appid')
      if (paramId) {
        const res = await fetch(`/api/appid?id=${encodeURIComponent(paramId)}`)
        const data = await res.json()
        if (data.valid) {
          sessionStorage.setItem(SESSION_KEY, paramId)
          setStatus('valid')
          return
        }
      }

      setStatus('invalid')
    }

    validate()
  }, [searchParams])

  if (status === 'pending') return null

  if (status === 'invalid') {
    return (
      <div className={styles.denied}>
        <p>Access denied.</p>
      </div>
    )
  }

  return <>{children}</>
}
