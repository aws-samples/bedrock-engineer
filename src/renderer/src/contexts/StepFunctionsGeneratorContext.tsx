import React, { createContext, useContext, useState, useEffect } from 'react'

interface StepFunctionsGeneratorSession {
  // User interaction
  userInput: string
  attachedImages: any[]
  
  // Step Functions content
  aslDefinition: any
  editorValue: string
  hasValidStateMachine: boolean
  
  // Generated content
  generatedExplanation?: string
}

interface StepFunctionsGeneratorContextType {
  // Session state
  currentSession: StepFunctionsGeneratorSession
  
  // User interaction
  userInput: string
  setUserInput: (input: string) => void
  attachedImages: any[]
  setAttachedImages: (images: any[]) => void
  
  // Step Functions content
  aslDefinition: any
  setAslDefinition: (asl: any) => void
  editorValue: string
  setEditorValue: (value: string) => void
  hasValidStateMachine: boolean
  setHasValidStateMachine: (valid: boolean) => void
  
  // Generated content
  generatedExplanation?: string
  setGeneratedExplanation: (explanation: string) => void
  
  // Session management
  clearSession: () => void
  updateSession: (updates: Partial<StepFunctionsGeneratorSession>) => void
}

const DEFAULT_ASL = {
  Comment: 'A Hello World example',
  StartAt: 'HelloWorld',
  States: {
    HelloWorld: {
      Type: 'Pass',
      Result: 'Hello World!',
      End: true
    }
  }
}

const DEFAULT_SESSION: StepFunctionsGeneratorSession = {
  userInput: '',
  attachedImages: [],
  aslDefinition: DEFAULT_ASL,
  editorValue: JSON.stringify(DEFAULT_ASL, null, 2),
  hasValidStateMachine: false,
  generatedExplanation: ''
}

const StepFunctionsGeneratorContext = createContext<StepFunctionsGeneratorContextType | undefined>(undefined)

export const StepFunctionsGeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session state
  const [currentSession, setCurrentSession] = useState<StepFunctionsGeneratorSession>(DEFAULT_SESSION)

  // Session management helpers
  const updateSession = (updates: Partial<StepFunctionsGeneratorSession>) => {
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

  // Step Functions content
  const setAslDefinition = (aslDefinition: any) => {
    updateSession({ aslDefinition })
  }

  const setEditorValue = (editorValue: string) => {
    updateSession({ editorValue })
  }

  const setHasValidStateMachine = (hasValidStateMachine: boolean) => {
    updateSession({ hasValidStateMachine })
  }

  // Generated content
  const setGeneratedExplanation = (generatedExplanation: string) => {
    updateSession({ generatedExplanation })
  }

  const value = {
    // Session state
    currentSession,
    
    // User interaction
    userInput: currentSession.userInput,
    setUserInput,
    attachedImages: currentSession.attachedImages,
    setAttachedImages,
    
    // Step Functions content
    aslDefinition: currentSession.aslDefinition,
    setAslDefinition,
    editorValue: currentSession.editorValue,
    setEditorValue,
    hasValidStateMachine: currentSession.hasValidStateMachine,
    setHasValidStateMachine,
    
    // Generated content
    generatedExplanation: currentSession.generatedExplanation,
    setGeneratedExplanation,
    
    // Session management
    clearSession,
    updateSession
  }

  return (
    <StepFunctionsGeneratorContext.Provider value={value}>{children}</StepFunctionsGeneratorContext.Provider>
  )
}

export const useStepFunctionsGenerator = () => {
  const context = useContext(StepFunctionsGeneratorContext)
  if (context === undefined) {
    throw new Error('useStepFunctionsGenerator must be used within a StepFunctionsGeneratorProvider')
  }
  return context
}