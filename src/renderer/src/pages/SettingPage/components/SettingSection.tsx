import React from 'react'
import { IconType } from 'react-icons'

interface SettingSectionProps {
  title: string
  description?: string
  icon?: IconType
  children: React.ReactNode
}

export const SettingSection: React.FC<SettingSectionProps> = ({
  title,
  description,
  icon: Icon,
  children
}) => {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          {Icon && (
            <div className="flex gap-2 items-center">
              <Icon className="text-lg" />
              <span>{title}</span>
            </div>
          )}
          {!Icon && title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
