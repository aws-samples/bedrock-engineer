import { Node, Edge } from '@xyflow/react'

export interface FlowContent {
  nodes: Node[]
  edges: Edge[]
  explanation: string
}

/**
 * Extract React Flow content from AI response text
 */
export function extractFlowContent(text: string): FlowContent {
  const result: FlowContent = {
    nodes: [],
    edges: [],
    explanation: ''
  }

  try {
    // Extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
    if (jsonMatch) {
      const jsonContent = jsonMatch[1]
      const flowData = JSON.parse(jsonContent)

      if (flowData.nodes && Array.isArray(flowData.nodes)) {
        result.nodes = flowData.nodes.map((node: any) => ({
          id: String(node.id),
          type: node.type || 'default',
          position: node.position || { x: 0, y: 0 },
          data: node.data || { label: 'Node' }
        }))
      }

      if (flowData.edges && Array.isArray(flowData.edges)) {
        result.edges = flowData.edges.map((edge: any) => ({
          id: edge.id || `e${edge.source}-${edge.target}`,
          source: String(edge.source),
          target: String(edge.target),
          label: edge.label
        }))
      }

      // Extract explanation (text after the JSON block)
      const explanationMatch = text.split(/```(?:json)?\s*\{[\s\S]*?\}\s*```/)[1]
      if (explanationMatch) {
        result.explanation = explanationMatch.trim()
      }
    }
  } catch (error) {
    console.error('Failed to parse flow content:', error)
  }

  return result
}

/**
 * Check if flow JSON is complete in the streaming text
 */
export function isFlowComplete(text: string): boolean {
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/i)
  if (!jsonMatch) return false

  try {
    const jsonContent = jsonMatch[1]
    const flowData = JSON.parse(jsonContent)
    return !!(flowData.nodes && Array.isArray(flowData.nodes) && flowData.nodes.length > 0)
  } catch {
    return false
  }
}

/**
 * Filter out JSON blocks from streaming content for explanation display
 */
export function filterJsonFromStreamingContent(content: string): string {
  return content.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/gi, '').trim()
}
