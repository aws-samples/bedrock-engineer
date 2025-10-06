import { useState, useEffect } from 'react'

export type ViewMode = 'grid' | 'compact'

const STORAGE_KEY = 'agentListViewMode'

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved === 'compact' ? 'compact' : 'grid') as ViewMode
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode)
  }, [viewMode])

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'grid' ? 'compact' : 'grid'))
  }

  return { viewMode, setViewMode, toggleViewMode }
}
