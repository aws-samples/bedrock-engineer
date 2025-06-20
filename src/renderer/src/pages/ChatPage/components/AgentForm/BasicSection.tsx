import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BasicSectionProps } from './types'
import { TbRobot } from 'react-icons/tb'
import { AGENT_ICONS } from '@renderer/components/icons/AgentIcons'

export const BasicSection: React.FC<BasicSectionProps> = ({
  name,
  description,
  icon,
  iconColor,
  onChange
}) => {
  const { t } = useTranslation()
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const iconPickerRef = useRef<HTMLDivElement>(null)

  // 自動選択のロジック
  const autoSelectIconAndColor = () => {
    // 1. エージェント名からキーワードを抽出して関連アイコンを選択
    const nameLower = name.toLowerCase()
    const descriptionLower = description.toLowerCase()

    // カテゴリに基づくキーワードマッピング
    const keywordMap = {
      development: [
        'code',
        'develop',
        'program',
        'software',
        'app',
        'developer',
        'programming',
        'coder',
        'api'
      ],
      cloud: ['cloud', 'aws', 'azure', 'infra', 'serverless', 'vpc', 'network', 'infrastructure'],
      devops: ['devops', 'ci/cd', 'pipeline', 'docker', 'kubernetes', 'container', 'deploy', 'git'],
      security: [
        'security',
        'auth',
        'authentication',
        'protection',
        'secure',
        'hack',
        'privacy',
        'compliance'
      ],
      monitoring: [
        'monitor',
        'metrics',
        'analytics',
        'data',
        'report',
        'chart',
        'logging',
        'dashboard'
      ]
    }

    // 特定のアイコンに直接マッピングされる可能性のあるキーワード
    const directIconMap: Record<string, string[]> = {
      robot: ['ai', 'assistant', 'bot', 'robot'],
      brain: ['intelligence', 'smart', 'thinking', 'cognitive', 'brain'],
      code: ['code', 'coding', 'program', 'developer'],
      bug: ['bug', 'debug', 'fix', 'issue', 'problem'],
      terminal: ['terminal', 'cli', 'command', 'shell', 'bash'],
      database: ['database', 'db', 'sql', 'nosql', 'data'],
      aws: ['aws', 'amazon'],
      docker: ['docker', 'container'],
      kubernetes: ['kubernetes', 'k8s'],
      search: ['search', 'find'],
      design: ['design', 'ui', 'ux'],
      architecture: ['architecture', 'structure'],
      chat: ['chat', 'conversation']
    }

    // 1. カテゴリ選択
    let selectedCategory = 'general'
    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (
        keywords.some(
          (keyword) => nameLower.includes(keyword) || descriptionLower.includes(keyword)
        )
      ) {
        selectedCategory = category
        break
      }
    }

    // 2. 特定のアイコン選択
    let selectedIcon
    for (const [iconValue, keywords] of Object.entries(directIconMap)) {
      if (
        keywords.some(
          (keyword) => nameLower.includes(keyword) || descriptionLower.includes(keyword)
        )
      ) {
        selectedIcon = iconValue
        break
      }
    }

    // アイコンがまだ選ばれていない場合、カテゴリからランダムに選択
    if (!selectedIcon) {
      const categoryIcons = AGENT_ICONS.filter((icon) => icon.category === selectedCategory)
      if (categoryIcons.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryIcons.length)
        selectedIcon = categoryIcons[randomIndex].value
      } else {
        // フォールバック: ランダムな汎用アイコン
        const generalIcons = AGENT_ICONS.filter((icon) => icon.category === 'general')
        const randomIndex = Math.floor(Math.random() * generalIcons.length)
        selectedIcon = generalIcons[randomIndex].value
      }
    }

    // 3. カラーの生成
    // 明るくて鮮やかな色を生成するため、彩度と明度を高めに設定
    const generateBrightColor = () => {
      // HSL色空間で色を生成（色相をランダム、彩度と明度は高め）
      const hue = Math.floor(Math.random() * 360) // 0-359の色相
      const saturation = Math.floor(60 + Math.random() * 40) // 60-99%の彩度
      const lightness = Math.floor(45 + Math.random() * 15) // 45-60%の明度

      // HSLからRGBへ変換
      const h = hue / 360
      const s = saturation / 100
      const l = lightness / 100

      let r, g, b

      if (s === 0) {
        r = g = b = l
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1 / 6) return p + (q - p) * 6 * t
          if (t < 1 / 2) return q
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
          return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q

        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
      }

      // RGBを16進数に変換
      const toHex = (x: number) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    const selectedColor = generateBrightColor()

    // 値を設定
    onChange('icon', selectedIcon)
    onChange('iconColor', selectedColor)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {/* Icon and Name Section */}
      <div className="flex items-center gap-4">
        {/* Name & Icon */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Name & Icon
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('nameDescription')}</p>
          <div className="flex gap-3">
            {/* Icon */}
            <div className="relative pt-1">
              <button
                type="button"
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center justify-center rounded-md border
              border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800
              transition-colors w-10 h-10 bg-blue-50 dark:bg-blue-900/20"
              >
                {icon ? (
                  React.cloneElement(
                    AGENT_ICONS.find((opt) => opt.value === icon)?.icon as React.ReactElement,
                    {
                      className: `w-5 h-5 ${!iconColor ? 'text-gray-700 dark:text-gray-300' : ''}`,
                      style: iconColor ? { color: iconColor } : undefined
                    }
                  )
                ) : (
                  <TbRobot className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                )}
              </button>

              {showIconPicker && (
                <div
                  ref={iconPickerRef}
                  className="absolute z-50 left-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border
                border-gray-200 dark:border-gray-700 p-2 w-[320px]"
                >
                  {/* Color Picker */}
                  <div className="p-2 border-b border-gray-200 dark:border-gray-700 pb-6 color-picker-container">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                      {t('iconColor')}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="color-picker-wrapper">
                        <input
                          type="color"
                          value={iconColor || '#FF0000'}
                          onChange={(e) => {
                            onChange('iconColor', e.target.value)
                          }}
                          className="w-8 h-8 rounded cursor-pointer"
                          style={{ position: 'relative', zIndex: 60 }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onChange('iconColor', undefined)}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {t('reset')}
                      </button>
                      <button
                        type="button"
                        onClick={autoSelectIconAndColor}
                        className="ml-auto px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                      >
                        {t('autoSelect')}
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('searchIcons')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                    bg-gray-50 dark:bg-gray-700 text-sm focus:outline-none focus:ring-2
                    focus:ring-blue-500 dark:focus:ring-blue-400 mb-2"
                    />
                  </div>
                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {(
                      [
                        'general',
                        'lifestyle',
                        'health',
                        'education',
                        'travel',
                        'food',
                        'shopping',
                        'development',
                        'cloud',
                        'devops',
                        'security',
                        'monitoring'
                      ] as const
                    ).map((category) => {
                      const categoryIcons = AGENT_ICONS.filter(
                        (opt) =>
                          opt.category === category &&
                          (searchQuery === '' ||
                            opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
                      )

                      if (categoryIcons.length === 0) return null

                      return (
                        <div key={category} className="mb-4 last:mb-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 px-1">
                            {t(`iconCategory.${category}`)}
                          </h3>
                          <div className="grid grid-cols-6 gap-2">
                            {categoryIcons.map((option) => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  onChange('icon', option.value)
                                  setShowIconPicker(false)
                                }}
                                className={`flex items-center justify-center p-2 rounded-lg hover:bg-gray-100
                              dark:hover:bg-gray-700 ${
                                icon === option.value
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'dark:text-gray-400'
                              }`}
                                title={option.label}
                              >
                                <div className="w-6 h-6 flex items-center justify-center">
                                  {React.cloneElement(option.icon as React.ReactElement, {
                                    className: 'w-8 h-8'
                                  })}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => onChange('name', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
              text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              placeholder={t('namePlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Description
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {t('descriptionDescription')}
        </p>
        <input
          type="text"
          value={description}
          onChange={(e) => onChange('description', e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          required
          placeholder={t('descriptionPlaceholder')}
        />
      </div>
    </div>
  )
}
