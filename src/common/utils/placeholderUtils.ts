/**
 * Placeholder replacement utilities
 * Provides consistent placeholder replacement functionality across main and renderer processes
 */

import { CommandConfig, FlowConfig, WindowConfig, KnowledgeBase } from '../../types/agent-chat'
import { BedrockAgent } from '../../types/agent'
import { CameraConfig } from '../../types/tools'

export interface PlaceholderValues {
  projectPath: string
  allowedCommands?: CommandConfig[]
  allowedWindows?: WindowConfig[]
  allowedCameras?: CameraConfig[]
  knowledgeBases?: KnowledgeBase[]
  bedrockAgents?: BedrockAgent[]
  flows?: FlowConfig[]
}

/**
 * Replace placeholders in text with provided values
 */
export function replacePlaceholders(text: string, placeholders: PlaceholderValues): string {
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
