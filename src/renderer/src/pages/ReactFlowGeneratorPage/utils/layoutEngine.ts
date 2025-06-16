import dagre from 'dagre'
import { Node, Edge, Position } from '@xyflow/react'

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 172
const nodeHeight = 36

/**
 * Apply auto-layout to nodes and edges using Dagre
 */
export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'TB') {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const newNode = {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2
      }
    }

    return newNode
  })

  return { nodes: newNodes, edges }
}

/**
 * Calculate optimal layout direction based on flow structure
 */
export function getOptimalLayoutDirection(nodes: Node[], edges: Edge[]): 'TB' | 'LR' {
  // Simple heuristic: if there are more horizontal connections, use LR layout
  const horizontalEdges = edges.filter((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source)
    const targetNode = nodes.find((n) => n.id === edge.target)
    if (!sourceNode || !targetNode) return false

    const dx = Math.abs(sourceNode.position.x - targetNode.position.x)
    const dy = Math.abs(sourceNode.position.y - targetNode.position.y)
    return dx > dy
  })

  return horizontalEdges.length > edges.length / 2 ? 'LR' : 'TB'
}
