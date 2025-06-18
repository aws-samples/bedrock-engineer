import { motion } from 'framer-motion'

export type DiagramMode = 'aws' | 'software-architecture' | 'business-process'

interface DiagramModeOption {
  id: DiagramMode
  label: string
  description: string
}

const modeOptions: DiagramModeOption[] = [
  {
    id: 'aws',
    label: 'AWS',
    description: 'AWS architecture diagrams'
  },
  {
    id: 'software-architecture',
    label: 'Software & DB',
    description: 'Software architecture & database design diagrams'
  },
  {
    id: 'business-process',
    label: 'Business Process',
    description: 'Business process & workflow diagrams'
  }
]

interface DiagramModeSelectorProps {
  selectedMode: DiagramMode
  onModeChange: (mode: DiagramMode) => void
  onRefresh?: () => void
}

export function DiagramModeSelector({
  selectedMode,
  onModeChange,
  onRefresh
}: DiagramModeSelectorProps) {
  const handleModeChange = (mode: DiagramMode) => {
    if (mode !== selectedMode) {
      onModeChange(mode)
      // モード変更時にページをリフレッシュ
      if (onRefresh) {
        onRefresh()
      }
    }
  }

  return (
    <div className="flex gap-2">
      {modeOptions.map((mode) => (
        <motion.button
          key={mode.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedMode === mode.id
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
          }`}
          onClick={() => handleModeChange(mode.id)}
        >
          {mode.label}
        </motion.button>
      ))}
    </div>
  )
}
