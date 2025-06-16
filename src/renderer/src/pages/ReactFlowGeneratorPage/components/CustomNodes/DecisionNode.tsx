import { Handle, Position, NodeProps } from '@xyflow/react'

export default function DecisionNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 shadow-md bg-yellow-100 dark:bg-yellow-800 border-2 border-yellow-300 dark:border-yellow-600 transform rotate-45 relative">
      <Handle type="target" position={Position.Top} className="w-3 h-3 -rotate-45" />
      <div className="text-xs font-medium text-yellow-900 dark:text-yellow-100 -rotate-45 whitespace-nowrap">
        {(data?.label as string) || 'Decision'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 -rotate-45" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 -rotate-45" />
    </div>
  )
}
