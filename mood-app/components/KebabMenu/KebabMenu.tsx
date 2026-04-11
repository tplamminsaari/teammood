'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './KebabMenu.module.css'

export function KebabMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(o => !o)}
        aria-label="Menu"
      >
        ⋮
      </button>

      {open && (
        <div className={styles.dropdown}>
          <button
            className={styles.item}
            onClick={() => {
              setOpen(false)
              router.push('/maintenance')
            }}
          >
            Maintenance
          </button>
        </div>
      )}
    </div>
  )
}
