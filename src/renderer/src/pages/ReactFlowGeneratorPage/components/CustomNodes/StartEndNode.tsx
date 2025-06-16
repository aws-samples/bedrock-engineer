import { Handle, Position, NodeProps } from '@xyflow/react'

export default function StartEndNode({ data, type }: NodeProps) {
  const isStart = type === 'start'
  const isEnd = type === 'end'

  return (
    <div
      className={`px-4 py-2 shadow-md rounded-full border-2 ${
        isStart
          ? 'bg-green-100 dark:bg-green-800 border-green-300 dark:border-green-600'
          : 'bg-red-100 dark:bg-red-800 border-red-300 dark:border-red-600'
      }`}
    >
      {!isStart && <Handle type="target" position={Position.Top} className="w-3 h-3" />}
      <div
        className={`text-xs font-medium whitespace-nowrap ${
          isStart ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
        }`}
      >
        {(data?.label as string) || (isStart ? 'Start' : 'End')}
      </div>
      {!isEnd && <Handle type="source" position={Position.Bottom} className="w-3 h-3" />}
    </div>
  )
}
