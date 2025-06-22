import { IdentifiableMessage } from './chat/message'
import { ToolName } from './tools'

// AttachedImage型定義（TextAreaコンポーネントから抽出）
export interface AttachedImage {
  file: File
  preview: string
  base64: string
}

// 各ジェネレーターページで共通の基本状態
export interface BaseGeneratorState {
  messages: IdentifiableMessage[]
  loading: boolean
  reasoning: boolean
  executingTool: ToolName | null
  latestReasoningText: string
  userInput: string
}

// WebsiteGenerator固有の状態
export interface WebsiteGeneratorState extends BaseGeneratorState {
  template: string
  styleType: {
    label: string
    value: string
  }
  showCode: boolean
  showContinueDevelopmentButton: boolean
}

// DiagramGenerator固有の状態
export interface DiagramGeneratorState extends BaseGeneratorState {
  diagramMode: 'aws' | 'software-architecture' | 'business-process'
  xml: string
  diagramExplanation: string
  streamingExplanation: string
  diagramHistory: Array<{
    xml: string
    explanation: string
    prompt: string
  }>
  selectedHistoryIndex: number | null
  showExplanation: boolean
  enableSearch: boolean
  generationStartTime: number
  xmlProgress: number
  progressMessage: string
  xmlLoading: boolean
  hasValidXml: boolean
}

// StepFunctionsGenerator固有の状態
export interface StepFunctionsGeneratorState extends BaseGeneratorState {
  editorValue: string
  asl: any
  hasValidStateMachine: boolean
  isComposing: boolean
}

// 共通のアクション型定義
export interface BaseGeneratorActions {
  handleSubmit: (input: string, images?: AttachedImage[]) => Promise<void>
  clearChat: () => Promise<void>
  stopGeneration: () => void
  setUserInput: (input: string) => void
  setMessages: (messages: IdentifiableMessage[]) => void
}
