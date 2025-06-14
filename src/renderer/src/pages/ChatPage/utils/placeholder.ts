// 独自の型定義を使用

import { CommandConfig, FlowConfig, WindowConfig } from '@/types/agent-chat'
import { BedrockAgent } from '@/types/agent'
import { KnowledgeBase } from 'src/types/agent-chat'
import { CameraConfig } from '@/types/tools'

type PlaceHolders = {
  projectPath: string
  allowedCommands?: CommandConfig[]
  allowedWindows?: WindowConfig[]
  allowedCameras?: CameraConfig[]
  knowledgeBases?: KnowledgeBase[]
  bedrockAgents?: BedrockAgent[]
  flows?: FlowConfig[]
}

export const replacePlaceholders = (text: string, placeholders: PlaceHolders) => {
  const {
    projectPath,
    allowedCommands = [],
    allowedWindows = [],
    allowedCameras = [],
    knowledgeBases = [],
    bedrockAgents = [],
    flows = []
  } = placeholders
  const yyyyMMdd = new Date().toISOString().slice(0, 10)
  return text
    .replace(/{{projectPath}}/g, projectPath)
    .replace(/{{date}}/g, yyyyMMdd)
    .replace(/{{allowedCommands}}/g, JSON.stringify(allowedCommands))
    .replace(/{{allowedWindows}}/g, JSON.stringify(allowedWindows))
    .replace(/{{allowedCameras}}/g, JSON.stringify(allowedCameras))
    .replace(/{{knowledgeBases}}/g, JSON.stringify(knowledgeBases))
    .replace(/{{bedrockAgents}}/g, JSON.stringify(bedrockAgents))
    .replace(/{{flows}}/g, JSON.stringify(flows))
}
