import { useState, useMemo } from 'react'
import { CustomAgent } from '@/types/agent-chat'

export type SortKey = 'name' | 'description' | 'tags' | 'status' | null
export type SortOrder = 'asc' | 'desc'

export const useAgentFilter = (agents: CustomAgent[]) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>()
    agents.forEach((agent) => {
      agent.tags?.forEach((tag) => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [agents])

  const filteredAgents = useMemo(() => {
    const searchLower = searchQuery.toLowerCase()

    // Filter agents
    const filtered = [...agents]
      .filter((agent) => {
        // Don't display special agents used on other pages
        const excludedAgentIds = [
          'reactGeneratorAgent',
          'vueGeneratorAgent',
          'svelteGeneratorAgent',
          // 'diagramGeneratorAgent',
          'softwareArchitectureAgent',
          'businessProcessAgent'
        ]
        return !excludedAgentIds.includes(agent.id)
      })
      .filter((agent) => {
        // Enhanced search: name, description, system prompt, scenarios
        const nameMatch = agent.name.toLowerCase().includes(searchLower)
        const descMatch = agent.description?.toLowerCase().includes(searchLower) || false
        const systemMatch = agent.system?.toLowerCase().includes(searchLower) || false
        const scenarioMatch =
          agent.scenarios?.some(
            (scenario) =>
              scenario.title.toLowerCase().includes(searchLower) ||
              scenario.content.toLowerCase().includes(searchLower)
          ) || false

        const textMatch = nameMatch || descMatch || systemMatch || scenarioMatch

        // Tag filter
        const tagMatch =
          selectedTags.length === 0 || selectedTags.every((tag) => agent.tags?.includes(tag))

        return textMatch && tagMatch
      })

    // Sort agents
    if (!sortKey) {
      return filtered
    }

    return filtered.sort((a, b) => {
      let comparison = 0

      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'description':
          comparison = (a.description || '').localeCompare(b.description || '')
          break
        case 'tags': {
          // Sort by first tag
          const aFirstTag = a.tags?.[0] || ''
          const bFirstTag = b.tags?.[0] || ''
          comparison = aFirstTag.localeCompare(bFirstTag)
          break
        }
        case 'status': {
          // Sort by active/shared status
          const aStatus = a.isShared ? 'shared' : 'custom'
          const bStatus = b.isShared ? 'shared' : 'custom'
          comparison = aStatus.localeCompare(bStatus)
          break
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [agents, searchQuery, selectedTags, sortKey, sortOrder])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Same key: toggle order or reset
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else {
        // Reset sort
        setSortKey(null)
        setSortOrder('asc')
      }
    } else {
      // New key: set to ascending
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  return {
    searchQuery,
    setSearchQuery,
    selectedTags,
    availableTags,
    filteredAgents,
    toggleTag,
    sortKey,
    sortOrder,
    handleSort
  }
}
