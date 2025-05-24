/**
 * Bedrock tools exports
 */

export { GenerateImageTool } from './GenerateImageTool'
export { RecognizeImageTool } from './RecognizeImageTool'
export { RetrieveTool } from './RetrieveTool'
export { InvokeBedrockAgentTool } from './InvokeBedrockAgentTool'
export { InvokeFlowTool } from './InvokeFlowTool'

import type { ToolDependencies } from '../../base/types'
import { GenerateImageTool } from './GenerateImageTool'
import { RecognizeImageTool } from './RecognizeImageTool'
import { RetrieveTool } from './RetrieveTool'
import { InvokeBedrockAgentTool } from './InvokeBedrockAgentTool'
import { InvokeFlowTool } from './InvokeFlowTool'

/**
 * Factory function to create all Bedrock tools
 */
export function createBedrockTools(dependencies: ToolDependencies) {
  return [
    { tool: new GenerateImageTool(dependencies), category: 'bedrock' as const },
    { tool: new RecognizeImageTool(dependencies), category: 'bedrock' as const },
    { tool: new RetrieveTool(dependencies), category: 'bedrock' as const },
    { tool: new InvokeBedrockAgentTool(dependencies), category: 'bedrock' as const },
    { tool: new InvokeFlowTool(dependencies), category: 'bedrock' as const }
  ]
}
