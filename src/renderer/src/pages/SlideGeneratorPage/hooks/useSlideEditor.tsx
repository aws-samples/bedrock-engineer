import { useState, useCallback, useRef } from 'react'
import { Slide, ContentElement } from '../types/slide'

export interface ElementSelection {
  elementId: string
  slideId: string
}

export interface EditingState {
  selectedElement: ElementSelection | null
  isDragging: boolean
  isResizing: boolean
  dragStart: { x: number; y: number } | null
  resizeHandle: string | null // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
}

export interface UseSlideEditorReturn {
  // 編集状態
  editingState: EditingState

  // 要素選択
  selectElement: (elementId: string, slideId: string) => void
  clearSelection: () => void

  // 要素移動
  startDrag: (event: React.MouseEvent, elementId: string) => void
  handleDrag: (event: React.MouseEvent) => void
  endDrag: () => void

  // 要素リサイズ
  startResize: (event: React.MouseEvent, handle: string) => void
  handleResize: (event: React.MouseEvent) => void
  endResize: () => void

  // 要素更新
  updateElement: (slideId: string, elementId: string, updates: Partial<ContentElement>) => void
  duplicateElement: (slideId: string, elementId: string) => void
  deleteElement: (slideId: string, elementId: string) => void

  // ユーティリティ
  getSelectedElement: (slides: Slide[]) => ContentElement | null
}

export const useSlideEditor = (
  slides: Slide[],
  onSlideUpdate: (updatedSlides: Slide[]) => void
): UseSlideEditorReturn => {
  const [editingState, setEditingState] = useState<EditingState>({
    selectedElement: null,
    isDragging: false,
    isResizing: false,
    dragStart: null,
    resizeHandle: null
  })

  const containerRef = useRef<HTMLDivElement>(null)

  // 要素選択
  const selectElement = useCallback((elementId: string, slideId: string) => {
    setEditingState((prev) => ({
      ...prev,
      selectedElement: { elementId, slideId }
    }))
  }, [])

  const clearSelection = useCallback(() => {
    setEditingState((prev) => ({
      ...prev,
      selectedElement: null
    }))
  }, [])

  // マウス座標をスライド座標系に変換
  const getSlideCoordinates = useCallback((event: React.MouseEvent, container: HTMLElement) => {
    const rect = container.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
  }, [])

  // 要素移動開始
  const startDrag = useCallback(
    (event: React.MouseEvent, _elementId: string) => {
      event.stopPropagation()
      const container = containerRef.current
      if (!container) return

      const coords = getSlideCoordinates(event, container)
      setEditingState((prev) => ({
        ...prev,
        isDragging: true,
        dragStart: coords
      }))
    },
    [getSlideCoordinates]
  )

  // 要素移動中
  const handleDrag = useCallback(
    (event: React.MouseEvent) => {
      if (!editingState.isDragging || !editingState.dragStart || !editingState.selectedElement) {
        return
      }

      const container = containerRef.current
      if (!container) return

      const currentCoords = getSlideCoordinates(event, container)
      const deltaX = currentCoords.x - editingState.dragStart.x
      const deltaY = currentCoords.y - editingState.dragStart.y

      // 要素の新しい位置を計算
      const updatedSlides = slides.map((slide) => {
        if (slide.id !== editingState.selectedElement?.slideId) return slide

        return {
          ...slide,
          elements: slide.elements.map((element) =>
            element.id === editingState.selectedElement?.elementId
              ? {
                  ...element,
                  position: {
                    x: Math.max(0, Math.min(95, currentCoords.x - deltaX)),
                    y: Math.max(0, Math.min(95, currentCoords.y - deltaY))
                  }
                }
              : element
          )
        }
      })

      onSlideUpdate(updatedSlides)
    },
    [editingState, getSlideCoordinates, slides, onSlideUpdate]
  )

  // 要素移動終了
  const endDrag = useCallback(() => {
    setEditingState((prev) => ({
      ...prev,
      isDragging: false,
      dragStart: null
    }))
  }, [])

  // 要素リサイズ開始
  const startResize = useCallback(
    (event: React.MouseEvent, handle: string) => {
      event.stopPropagation()
      const container = containerRef.current
      if (!container) return

      const coords = getSlideCoordinates(event, container)
      setEditingState((prev) => ({
        ...prev,
        isResizing: true,
        resizeHandle: handle,
        dragStart: coords
      }))
    },
    [getSlideCoordinates]
  )

  // 要素リサイズ中
  const handleResize = useCallback(
    (event: React.MouseEvent) => {
      if (
        !editingState.isResizing ||
        !editingState.dragStart ||
        !editingState.selectedElement ||
        !editingState.resizeHandle
      ) {
        return
      }

      const container = containerRef.current
      if (!container) return

      const currentCoords = getSlideCoordinates(event, container)
      const deltaX = currentCoords.x - editingState.dragStart.x
      const deltaY = currentCoords.y - editingState.dragStart.y

      // リサイズハンドルに応じてサイズと位置を調整
      const updates: Partial<ContentElement> = {}

      if (editingState.resizeHandle.includes('e')) {
        updates.size = {
          width: Math.max(5, Math.min(95, (updates.size?.width || 0) + deltaX)),
          height: updates.size?.height || 0
        }
      }
      if (editingState.resizeHandle.includes('w')) {
        updates.position = {
          x: Math.max(0, currentCoords.x),
          y: updates.position?.y || 0
        }
        updates.size = {
          width: Math.max(5, (updates.size?.width || 0) - deltaX),
          height: updates.size?.height || 0
        }
      }
      if (editingState.resizeHandle.includes('s')) {
        updates.size = {
          width: updates.size?.width || 0,
          height: Math.max(5, Math.min(95, (updates.size?.height || 0) + deltaY))
        }
      }
      if (editingState.resizeHandle.includes('n')) {
        updates.position = {
          x: updates.position?.x || 0,
          y: Math.max(0, currentCoords.y)
        }
        updates.size = {
          width: updates.size?.width || 0,
          height: Math.max(5, (updates.size?.height || 0) - deltaY)
        }
      }

      // リサイズ更新を適用
      const updatedSlides = slides.map((slide) => {
        if (slide.id !== editingState.selectedElement?.slideId) return slide

        return {
          ...slide,
          elements: slide.elements.map((element) =>
            element.id === editingState.selectedElement?.elementId
              ? { ...element, ...updates }
              : element
          )
        }
      })

      onSlideUpdate(updatedSlides)
    },
    [editingState, getSlideCoordinates, slides, onSlideUpdate]
  )

  // 要素リサイズ終了
  const endResize = useCallback(() => {
    setEditingState((prev) => ({
      ...prev,
      isResizing: false,
      resizeHandle: null,
      dragStart: null
    }))
  }, [])

  // 要素更新
  const updateElement = useCallback(
    (slideId: string, elementId: string, updates: Partial<ContentElement>) => {
      const updatedSlides = slides.map((slide) => {
        if (slide.id !== slideId) return slide

        return {
          ...slide,
          elements: slide.elements.map((element) =>
            element.id === elementId ? { ...element, ...updates } : element
          )
        }
      })

      onSlideUpdate(updatedSlides)
    },
    [slides, onSlideUpdate]
  )

  // 要素複製
  const duplicateElement = useCallback(
    (slideId: string, elementId: string) => {
      const updatedSlides = slides.map((slide) => {
        if (slide.id !== slideId) return slide

        const elementToDuplicate = slide.elements.find((e) => e.id === elementId)
        if (!elementToDuplicate) return slide

        const duplicatedElement: ContentElement = {
          ...elementToDuplicate,
          id: `${elementId}-copy-${Date.now()}`,
          position: {
            x: Math.min(90, elementToDuplicate.position.x + 5),
            y: Math.min(90, elementToDuplicate.position.y + 5)
          }
        }

        return {
          ...slide,
          elements: [...slide.elements, duplicatedElement]
        }
      })

      onSlideUpdate(updatedSlides)
    },
    [slides, onSlideUpdate]
  )

  // 要素削除
  const deleteElement = useCallback(
    (slideId: string, elementId: string) => {
      const updatedSlides = slides.map((slide) => {
        if (slide.id !== slideId) return slide

        return {
          ...slide,
          elements: slide.elements.filter((element) => element.id !== elementId)
        }
      })

      onSlideUpdate(updatedSlides)

      // 削除された要素が選択されていた場合は選択解除
      if (editingState.selectedElement?.elementId === elementId) {
        clearSelection()
      }
    },
    [slides, onSlideUpdate, editingState.selectedElement, clearSelection]
  )

  // 選択された要素を取得
  const getSelectedElement = useCallback(
    (slides: Slide[]): ContentElement | null => {
      if (!editingState.selectedElement) return null

      const slide = slides.find((s) => s.id === editingState.selectedElement?.slideId)
      if (!slide) return null

      return slide.elements.find((e) => e.id === editingState.selectedElement?.elementId) || null
    },
    [editingState.selectedElement]
  )

  return {
    editingState,
    selectElement,
    clearSelection,
    startDrag,
    handleDrag,
    endDrag,
    startResize,
    handleResize,
    endResize,
    updateElement,
    duplicateElement,
    deleteElement,
    getSelectedElement
  }
}
