'use client'

import { useState, useEffect } from 'react'

interface CurrentUser {
  id: number
  name: string
}

const STORAGE_KEY = 'teammood_user'

function readFromStorage(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CurrentUser
  } catch {
    return null
  }
}

export function useCurrentUser() {
  const [user, setUserState] = useState<CurrentUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUserState(readFromStorage())
    setReady(true)
  }, [])

  function setUser(id: number, name: string) {
    const next = { id, name }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUserState(next)
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY)
    setUserState(null)
  }

  return { user, ready, setUser, clearUser }
}
