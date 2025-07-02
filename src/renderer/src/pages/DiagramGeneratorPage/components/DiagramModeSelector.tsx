import { motion } from 'framer-motion'
import { AiOutlineCloud, AiOutlineCode, AiOutlineProject } from 'react-icons/ai'

export type DiagramMode = 'aws' | 'software-architecture' | 'business-process'

interface DiagramModeOption {
  id: DiagramMode
  label: string
  description: string
  icon: JSX.Element
}

const modeOptions: DiagramModeOption[] = [
  {
    id: 'aws',
    label: 'Cloud',
    description: 'AWS architecture diagrams',
    icon: <AiOutlineCloud className="w-4 h-4" />
  },
  {
    id: 'software-architecture',
    label: 'Software',
    description: 'Software architecture & database design diagrams',
    icon: <AiOutlineCode className="w-4 h-4" />
  },
  {
    id: 'business-process',
    label: 'Business',
    description: 'Business process & workflow diagrams',
    icon: <AiOutlineProject className="w-4 h-4" />
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
          className={`
            text-gray-900
            ${selectedMode === mode.id ? 'bg-green-50' : 'bg-white'}
            hover:bg-green-50
            border
            ${selectedMode === mode.id ? 'border-green-600' : 'border-gray-200'}
            focus:ring-4
            focus:outline-none
            focus:ring-gray-100
            font-medium
            rounded-[1rem]
            text-xs
            px-3
            py-1.5
            inline-flex
            items-center
            flex
            gap-2
            dark:bg-gray-800
            dark:text-white
            dark:border-gray-600
            dark:hover:bg-gray-700
          `}
          onClick={() => handleModeChange(mode.id)}
        >
          <div className="w-[18px]">{mode.icon}</div>
          <span>{mode.label}</span>
        </motion.button>
      ))}
    </div>
  )
}
