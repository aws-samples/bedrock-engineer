import React, { createContext, useContext, useState, useEffect } from 'react'
import { KnowledgeBase } from '@/types/agent-chat'

interface WebsiteGeneratorSession {
  // Session management
  template: string
  userInput: string
  generatedCode: string
  xml: string
  attachedImages: any[]

  // Knowledge Base Settings
  knowledgeBases: KnowledgeBase[]
  enableKnowledgeBase: boolean
  enableSearch: boolean
}

interface WebsiteGeneratorContextType {
  // Session state
  currentSession: WebsiteGeneratorSession

  // Template management
  template: string
  setTemplate: (template: string) => void

  // User input and generated content
  userInput: string
  setUserInput: (input: string) => void
  generatedCode: string
  setGeneratedCode: (code: string) => void
  xml: string
  setXml: (xml: string) => void
  attachedImages: any[]
  setAttachedImages: (images: any[]) => void

  // Knowledge Base Settings
  knowledgeBases: KnowledgeBase[]
  setKnowledgeBases: (knowledgeBases: KnowledgeBase[]) => void
  enableKnowledgeBase: boolean
  setEnableKnowledgeBase: (bool: boolean) => void
  enableSearch: boolean
  setEnableSearch: (bool: boolean) => void

  // Session management
  clearSession: () => void
  updateSession: (updates: Partial<WebsiteGeneratorSession>) => void
}

const WebsiteGeneratorContext = createContext<WebsiteGeneratorContextType | undefined>(undefined)

const DEFAULT_SESSION: WebsiteGeneratorSession = {
  template: 'react-ts',
  userInput: '',
  generatedCode: '',
  xml: '',
  attachedImages: [],
  knowledgeBases: [],
  enableKnowledgeBase: false,
  enableSearch: false
}

export const WebsiteGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session state
  const [currentSession, setCurrentSession] = useState<WebsiteGeneratorSession>(DEFAULT_SESSION)

  // Initialize settings from store
  useEffect(() => {
    const settings = window.store.get('websiteGenerator')
    if (settings) {
      const initialSession: WebsiteGeneratorSession = {
        ...DEFAULT_SESSION,
        knowledgeBases: settings.knowledgeBases || [],
        enableKnowledgeBase: settings.enableKnowledgeBase || false,
        enableSearch: settings.enableSearch || false
      }
      setCurrentSession(initialSession)
    }
  }, [])

  // Session management helpers
  const updateSession = (updates: Partial<WebsiteGeneratorSession>) => {
    setCurrentSession((prev) => ({ ...prev, ...updates }))
  }

  const clearSession = () => {
    setCurrentSession(DEFAULT_SESSION)
  }

  // Template management
  const setTemplate = (template: string) => {
    updateSession({ template })
  }

  // User input and generated content
  const setUserInput = (userInput: string) => {
    updateSession({ userInput })
  }

  const setGeneratedCode = (generatedCode: string) => {
    updateSession({ generatedCode })
  }

  const setXml = (xml: string) => {
    updateSession({ xml })
  }

  const setAttachedImages = (attachedImages: any[]) => {
    updateSession({ attachedImages })
  }

  // Knowledge Base Settings
  const setKnowledgeBases = (knowledgeBases: KnowledgeBase[]) => {
    updateSession({ knowledgeBases })
    const settings = window.store.get('websiteGenerator')
    window.store.set('websiteGenerator', {
      ...settings,
      knowledgeBases: knowledgeBases
    })
  }

  const setEnableKnowledgeBase = (enableKnowledgeBase: boolean) => {
    updateSession({ enableKnowledgeBase })
    const settings = window.store.get('websiteGenerator')
    window.store.set('websiteGenerator', {
      ...settings,
      enableKnowledgeBase
    })
  }

  const setEnableSearch = (enableSearch: boolean) => {
    updateSession({ enableSearch })
    const settings = window.store.get('websiteGenerator')
    window.store.set('websiteGenerator', {
      ...settings,
      enableSearch
    })
  }

  const value = {
    // Session state
    currentSession,

    // Template management
    template: currentSession.template,
    setTemplate,

    // User input and generated content
    userInput: currentSession.userInput,
    setUserInput,
    generatedCode: currentSession.generatedCode,
    setGeneratedCode,
    xml: currentSession.xml,
    setXml,
    attachedImages: currentSession.attachedImages,
    setAttachedImages,

    // Knowledge Base Settings
    knowledgeBases: currentSession.knowledgeBases,
    setKnowledgeBases,
    enableKnowledgeBase: currentSession.enableKnowledgeBase,
    setEnableKnowledgeBase,
    enableSearch: currentSession.enableSearch,
    setEnableSearch,

    // Session management
    clearSession,
    updateSession
  }

  return (
    <WebsiteGeneratorContext.Provider value={value}>{children}</WebsiteGeneratorContext.Provider>
  )
}

export const useWebsiteGeneratorSetting = () => {
  const context = useContext(WebsiteGeneratorContext)
  if (context === undefined) {
    throw new Error('useWebsiteGenerator must be used within a WebsiteGeneratorProvider')
  }
  return context
}
