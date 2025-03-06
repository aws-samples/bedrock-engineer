import { Tool } from '@aws-sdk/client-bedrock-runtime'

export type AgentChatConfig = {
  automode: boolean
  ignoreFiles?: string[]
}

export type SendMsgKey = 'Enter' | 'Cmd+Enter'

export type ToolState = {
  enabled: boolean
} & Tool

export type Scenario = {
  title: string
  content: string
}

export type Agent = {
  id: string
  name: string
  description: string
  system: string
  scenarios: Scenario[]
  icon?: AgentIcon
  iconColor?: string
  tags?: string[]
}

export type AgentIcon =
  | 'robot'
  | 'brain'
  | 'chat'
  | 'bulb'
  | 'books'
  | 'pencil'
  | 'messages'
  | 'puzzle'
  | 'world'
  | 'code'
  | 'terminal'
  | 'terminal2'
  | 'keyboard'
  | 'bug'
  | 'test'
  | 'api'
  | 'database'
  | 'architecture'
  | 'design'
  | 'diagram'
  | 'settings'
  | 'tool'
  | 'aws'
  | 'cloud'
  | 'server'
  | 'network'
  | 'laptop'
  | 'microchip'
  | 'docker'
  | 'kubernetes'
  | 'terraform'
  | 'git'
  | 'github'
  | 'kanban'
  | 'security'
  | 'lock'
  | 'shield'
  | 'bank'
  | 'search'
  | 'chart'
  | 'grafana'
  | 'prometheus'

export type CustomAgent = Agent & {
  isCustom?: boolean
  isShared?: boolean
}

export type AgentSettings = {
  customAgents: CustomAgent[]
}

export type KnowledgeBase = {
  knowledgeBaseId: string
  description: string
}
