import { FaTimes } from 'react-icons/fa'

interface DomainTagProps {
  domain: string
  onRemove: (domain: string) => void
  variant?: 'include' | 'exclude'
}

export const DomainTag = ({ domain, onRemove, variant = 'include' }: DomainTagProps) => {
  const bgColor =
    variant === 'include'
      ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'

  const hoverColor =
    variant === 'include'
      ? 'hover:text-blue-600 dark:hover:text-blue-400'
      : 'hover:text-gray-500 dark:hover:text-gray-400'

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${bgColor}`}>
      {domain}
      <button onClick={() => onRemove(domain)} className={`cursor-pointer ${hoverColor}`}>
        <FaTimes className="w-3 h-3" />
      </button>
    </span>
  )
}
