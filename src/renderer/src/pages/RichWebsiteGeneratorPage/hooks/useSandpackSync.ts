import { useState, useEffect, useRef } from 'react'
import { useRichWebsiteGenerator } from '../contexts/RichWebsiteGeneratorContext'

/**
 * Custom hook for synchronizing Sandpack state and managing preview updates
 * @param loading - Whether the chat is currently loading
 * @param messagesLength - Number of messages in the chat
 * @param hasStartedGeneration - Whether generation has started
 * @param runSandpack - Function to run Sandpack
 * @param onPreviewActivated - Callback when preview should be activated
 * @returns Preview key for forcing remount
 */
export function useSandpackSync(
  loading: boolean,
  messagesLength: number,
  hasStartedGeneration: boolean,
  runSandpack: () => void,
  onPreviewActivated: () => void
) {
  const { lastUpdate } = useRichWebsiteGenerator()
  const [previewKey, setPreviewKey] = useState(0)
  const prevLoadingRef = useRef(loading)

  // Run Sandpack when files are updated
  useEffect(() => {
    if (lastUpdate > 0) {
      console.log('Sandpack files updated at:', new Date(lastUpdate).toISOString())
      runSandpack()
    }
  }, [lastUpdate, runSandpack])

  // Auto-switch to preview when conversation completes
  useEffect(() => {
    // Only trigger when loading changes from true to false (conversation complete)
    if (prevLoadingRef.current && !loading && messagesLength > 0 && hasStartedGeneration) {
      // Run Sandpack
      runSandpack()
      // Switch to preview tab
      onPreviewActivated()
      // Force preview remount
      setPreviewKey((prev) => prev + 1)
    }
    // Save current loading state
    prevLoadingRef.current = loading
  }, [loading, messagesLength, hasStartedGeneration, runSandpack, onPreviewActivated])

  return { previewKey, refreshPreview: () => setPreviewKey((prev) => prev + 1) }
}
