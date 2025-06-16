import { Handle, Position, NodeProps } from '@xyflow/react'

export default function ProcessNode({ data }: NodeProps) {
  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600">
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      <div className="text-sm font-medium text-gray-900 dark:text-white">
        {(data?.label as string) || 'Process'}
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  )
}
