export interface User {
  id: number
  name: string
  lastActive: string
}

export interface MoodEntry {
  id: number
  userId: number
  userName: string
  moodRating: number
  imageData: string | null
  hasTrophy: boolean
  submittedAt: string
  likeCount: number
  likedByMe: boolean
}

export interface DailyConfig {
  sprintName: string
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😠',
  2: '😕',
  3: '😐',
  4: '🙂',
  5: '😄',
}

export const MAX_USERS = 128
