import { useState, useCallback } from 'react'

type View = 'code' | 'preview'

/**
 * Custom hook for managing view state (tabs and panels)
 * @returns View state and handlers
 */
export function useViewManagement() {
  const [activeTab, setActiveTab] = useState<View>('preview')
  const [isChatPanelVisible, setIsChatPanelVisible] = useState(true)

  const handleTabChange = useCallback((tab: View) => {
    setActiveTab(tab)
  }, [])

  const toggleChatPanel = useCallback(() => {
    setIsChatPanelVisible((prev) => !prev)
  }, [])

  return {
    activeTab,
    isChatPanelVisible,
    handleTabChange,
    toggleChatPanel
  }
}
