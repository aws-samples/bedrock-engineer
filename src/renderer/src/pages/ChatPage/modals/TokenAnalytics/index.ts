import { useCallback, useState } from 'react'
import { TokenAnalyticsModal } from './TokenAnalyticsModal'

// モーダル表示のカスタムフック
export const useTokenAnalyticsModal = () => {
  const [show, setShow] = useState(false)

  const handleOpen = useCallback(() => {
    setShow(true)
  }, [])

  const handleClose = useCallback(() => {
    setShow(false)
  }, [])

  return {
    show,
    handleOpen,
    handleClose,
    TokenAnalyticsModal
  }
}

export { TokenAnalyticsModal }
