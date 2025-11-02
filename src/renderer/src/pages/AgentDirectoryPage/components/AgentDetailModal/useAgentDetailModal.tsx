import { useState, useEffect } from 'react'

interface UseAgentDetailModalProps {
  onAddToMyAgents?: () => void
  onClose: () => void
}

export const useAgentDetailModal = ({ onAddToMyAgents, onClose }: UseAgentDetailModalProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState<boolean | null>(null)

  const handleAddToMyAgents = async () => {
    if (onAddToMyAgents) {
      setIsAdding(true)
      try {
        onAddToMyAgents()
        setAddSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } catch (error) {
        setAddSuccess(false)
        console.error('Error adding agent:', error)
      } finally {
        setIsAdding(false)
      }
    }
  }

  // Reset state when modal closes
  useEffect(() => {
    return () => {
      setAddSuccess(null)
      setIsAdding(false)
    }
  }, [])

  return {
    isAdding,
    addSuccess,
    handleAddToMyAgents
  }
}
