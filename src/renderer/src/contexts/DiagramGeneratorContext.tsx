import React, { createContext, useContext, useState, useEffect } from 'react'

export type DiagramMode = 'aws' | 'software-architecture' | 'business-process'

interface DiagramGeneratorSession {
  // User interaction
  userInput: string
  attachedImages: any[]
  
  // Diagram content
  xml: string
  diagramMode: DiagramMode
  generatedExplanation?: string
  
  // UI state
  showExplanation: boolean
}

interface DiagramGeneratorContextType {
  // Session state
  currentSession: DiagramGeneratorSession
  
  // User interaction
  userInput: string
  setUserInput: (input: string) => void
  attachedImages: any[]
  setAttachedImages: (images: any[]) => void
  
  // Diagram content
  xml: string
  setXml: (xml: string) => void
  diagramMode: DiagramMode
  setDiagramMode: (mode: DiagramMode) => void
  generatedExplanation?: string
  setGeneratedExplanation: (explanation: string) => void
  
  // UI state
  showExplanation: boolean
  setShowExplanation: (show: boolean) => void
  
  // Session management
  clearSession: () => void
  updateSession: (updates: Partial<DiagramGeneratorSession>) => void
}

const DEFAULT_SESSION: DiagramGeneratorSession = {
  userInput: '',
  attachedImages: [],
  xml: '',
  diagramMode: 'aws',
  generatedExplanation: '',
  showExplanation: false
}

const DiagramGeneratorContext = createContext<DiagramGeneratorContextType | undefined>(undefined)

export const DiagramGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session state
  const [currentSession, setCurrentSession] = useState<DiagramGeneratorSession>(DEFAULT_SESSION)

  // Session management helpers
  const updateSession = (updates: Partial<DiagramGeneratorSession>) => {
    setCurrentSession(prev => ({ ...prev, ...updates }))
  }

  const clearSession = () => {
    setCurrentSession(DEFAULT_SESSION)
  }

  // User interaction
  const setUserInput = (userInput: string) => {
    updateSession({ userInput })
  }

  const setAttachedImages = (attachedImages: any[]) => {
    updateSession({ attachedImages })
  }

  // Diagram content
  const setXml = (xml: string) => {
    updateSession({ xml })
  }

  const setDiagramMode = (diagramMode: DiagramMode) => {
    updateSession({ diagramMode })
  }

  const setGeneratedExplanation = (generatedExplanation: string) => {
    updateSession({ generatedExplanation })
  }

  // UI state
  const setShowExplanation = (showExplanation: boolean) => {
    updateSession({ showExplanation })
  }

  const value = {
    // Session state
    currentSession,
    
    // User interaction
    userInput: currentSession.userInput,
    setUserInput,
    attachedImages: currentSession.attachedImages,
    setAttachedImages,
    
    // Diagram content
    xml: currentSession.xml,
    setXml,
    diagramMode: currentSession.diagramMode,
    setDiagramMode,
    generatedExplanation: currentSession.generatedExplanation,
    setGeneratedExplanation,
    
    // UI state
    showExplanation: currentSession.showExplanation,
    setShowExplanation,
    
    // Session management
    clearSession,
    updateSession
  }

  return (
    <DiagramGeneratorContext.Provider value={value}>{children}</DiagramGeneratorContext.Provider>
  )
}

export const useDiagramGenerator = () => {
  const context = useContext(DiagramGeneratorContext)
  if (context === undefined) {
    throw new Error('useDiagramGenerator must be used within a DiagramGeneratorProvider')
  }
  return context
}