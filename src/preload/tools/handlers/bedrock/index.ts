/**
 * Bedrock tools exports
 */

export { GenerateImageTool } from './GenerateImageTool'
export { GenerateVideoTool } from './GenerateVideoTool'
export { CheckVideoStatusTool } from './CheckVideoStatusTool'
export { DownloadVideoTool } from './DownloadVideoTool'
export { RecognizeImageTool } from './RecognizeImageTool'
export { RecognizeVideoTool } from './RecognizeVideoTool'
export { RetrieveTool } from './RetrieveTool'
export { InvokeBedrockAgentTool } from './InvokeBedrockAgentTool'
export { InvokeFlowTool } from './InvokeFlowTool'

import type { ToolDependencies } from '../../base/types'
import { GenerateImageTool } from './GenerateImageTool'
import { GenerateVideoTool } from './GenerateVideoTool'
import { CheckVideoStatusTool } from './CheckVideoStatusTool'
import { DownloadVideoTool } from './DownloadVideoTool'
import { RecognizeImageTool } from './RecognizeImageTool'
import { RecognizeVideoTool } from './RecognizeVideoTool'
import { RetrieveTool } from './RetrieveTool'
import { InvokeBedrockAgentTool } from './InvokeBedrockAgentTool'
import { InvokeFlowTool } from './InvokeFlowTool'

/**
 * Factory function to create all Bedrock tools
 */
export function createBedrockTools(dependencies: ToolDependencies) {
  return [
    { tool: new GenerateImageTool(dependencies), category: 'bedrock' as const },
    { tool: new GenerateVideoTool(dependencies), category: 'bedrock' as const },
    { tool: new CheckVideoStatusTool(dependencies), category: 'bedrock' as const },
    { tool: new DownloadVideoTool(dependencies), category: 'bedrock' as const },
    { tool: new RecognizeImageTool(dependencies), category: 'bedrock' as const },
    { tool: new RecognizeVideoTool(dependencies), category: 'bedrock' as const },
    { tool: new RetrieveTool(dependencies), category: 'bedrock' as const },
    { tool: new InvokeBedrockAgentTool(dependencies), category: 'bedrock' as const },
    { tool: new InvokeFlowTool(dependencies), category: 'bedrock' as const }
  ]
}
