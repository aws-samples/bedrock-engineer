export interface SettingFormData {
  // Project Settings
  projectPath: string

  // Language Settings
  language: string

  // Agent Chat Settings
  tavilySearchApiKey: string

  // AWS Settings
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string

  // Bedrock Settings
  llmModelId: string
  inferenceParams: {
    maxTokens: number
    temperature: number
    topP: number
  }

  // Advanced Settings
  sendMsgKey: 'Enter' | 'Cmd+Enter'

  // Notification Settings
  enableNotification?: boolean
}

export interface SettingFormErrors {
  awsAccessKeyId?: string
  awsSecretAccessKey?: string
  tavilySearchApiKey?: string
  inferenceParams?: {
    maxTokens?: string
    temperature?: string
    topP?: string
  }
}

export interface SettingSectionProps {
  className?: string
  children: React.ReactNode
  title: string
  description?: string
}
