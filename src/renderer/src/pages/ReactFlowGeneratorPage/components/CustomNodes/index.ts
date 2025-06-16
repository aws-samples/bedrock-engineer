import { NodeTypes } from '@xyflow/react'
import ProcessNode from './ProcessNode'
import DecisionNode from './DecisionNode'
import StartEndNode from './StartEndNode'

export const CustomNodeTypes: NodeTypes = {
  process: ProcessNode,
  decision: DecisionNode,
  start: StartEndNode,
  end: StartEndNode,
  subprocess: ProcessNode
}
