'use client'

import useSWR from 'swr'
import { useRef, useEffect } from 'react'
import type { MoodEntry, DailyConfig } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useTeamData(date: string, userId: number | null) {
  const entriesKey = `/api/entries?date=${date}${userId ? `&userId=${userId}` : ''}`
  const configKey = `/api/config?date=${date}`

  const {
    data: entriesData,
    mutate: mutateEntries,
    isLoading: entriesLoading,
  } = useSWR(entriesKey, fetcher, { refreshInterval: 8000 })

  const { data: configData, mutate: mutateConfig } = useSWR(configKey, fetcher, {
    refreshInterval: 8000,
  })

  const entries: MoodEntry[] = entriesData?.entries ?? []
  const config: DailyConfig = { sprintName: configData?.sprintName ?? '' }

  // Track which entry ids are new and which had a like count change since last poll
  const prevEntriesRef = useRef<MoodEntry[]>([])
  const newEntryIdsRef = useRef<Set<number>>(new Set())
  const likeChangedIdsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    const prev = prevEntriesRef.current
    const prevIds = new Set(prev.map(e => e.id))
    const prevLikes = new Map(prev.map(e => [e.id, e.likeCount]))

    newEntryIdsRef.current = new Set(
      entries.filter(e => !prevIds.has(e.id)).map(e => e.id)
    )
    likeChangedIdsRef.current = new Set(
      entries
        .filter(e => prevIds.has(e.id) && e.likeCount !== prevLikes.get(e.id))
        .map(e => e.id)
    )

    prevEntriesRef.current = entries
  })

  return {
    entries,
    config,
    newEntryIds: newEntryIdsRef.current,
    likeChangedIds: likeChangedIdsRef.current,
    loading: entriesLoading,
    mutateEntries,
    mutateConfig,
  }
}
