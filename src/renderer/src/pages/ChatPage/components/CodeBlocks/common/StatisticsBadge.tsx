import React from 'react'
import { StatisticsBadgeProps } from './types'

export const StatisticsBadge: React.FC<StatisticsBadgeProps> = ({ label, value, change, unit }) => {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value
  const unitText = unit || ''

  return (
    <div className="flex items-center gap-1">
      <span className="font-medium">{label}:</span>
      <span>
        {displayValue}
        {unitText}
      </span>
      {change && (
        <span>
          → {typeof change.to === 'number' ? change.to.toLocaleString() : change.to}
          {unitText}
        </span>
      )}
      {change && change.from !== change.to && (
        <span
          className={`ml-1 ${
            (typeof change.to === 'number' &&
              typeof change.from === 'number' &&
              change.to > change.from) ||
            (typeof change.to === 'string' &&
              typeof change.from === 'string' &&
              change.to.length > change.from.length)
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}
        >
          (
          {typeof change.to === 'number' && typeof change.from === 'number'
            ? (change.to > change.from ? '+' : '') + (change.to - change.from).toLocaleString()
            : typeof change.to === 'string' && typeof change.from === 'string'
              ? (change.to.length > change.from.length ? '+' : '') +
                (change.to.length - change.from.length)
              : ''}
          {unitText})
        </span>
      )}
    </div>
  )
}
