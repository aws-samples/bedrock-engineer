import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { useSettings } from './SettingsContext'
import { CustomAgent, OrganizationConfig } from '@/types/agent-chat'

// コンテキストの型を定義
interface AgentDirectoryContextType {
  // 状態
  agents: CustomAgent[]
  isLoading: boolean
  searchQuery: string
  selectedAgent: CustomAgent | null
  allTags: string[]
  selectedTags: string[]

  // 組織関連の状態
  organizationAgents: Record<string, CustomAgent[]>
  selectedOrganization: string | 'all' | 'contributors'
  organizations: OrganizationConfig[]

  // 操作関数
  setSearchQuery: (query: string) => void
  setSelectedAgent: (agent: CustomAgent | null) => void
  addSelectedAgentToMyAgents: () => Promise<void>
  handleTagToggle: (tag: string) => void
  clearTags: () => void

  // 組織関連の操作関数
  setSelectedOrganization: (orgId: string | 'all' | 'contributors') => void
  loadOrganizationAgents: (orgId: string) => Promise<void>
}

// コンテキストを作成
const AgentDirectoryContext = createContext<AgentDirectoryContextType | undefined>(undefined)

// プロバイダーコンポーネント
export const AgentDirectoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SettingsContext から必要な関数とデータを取得
  const {
    directoryAgents,
    isDirectoryAgentLoading,
    loadDirectoryAgents,
    addDirectoryAgentToCustom,
    organizations
  } = useSettings()

  // 状態
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 組織関連の状態
  const [organizationAgents, setOrganizationAgents] = useState<Record<string, CustomAgent[]>>({})
  const [selectedOrganization, setSelectedOrganization] = useState<string | 'all' | 'contributors'>(
    'contributors'
  )
  const [isLoadingOrganizationAgents, setIsLoadingOrganizationAgents] = useState<boolean>(false)

  // 組織エージェントを読み込む関数
  const loadOrganizationAgents = useCallback(
    async (orgId: string) => {
      if (organizationAgents[orgId]) {
        return // 既に読み込み済み
      }

      setIsLoadingOrganizationAgents(true)
      try {
        const organization = organizations.find((org) => org.id === orgId)
        if (!organization) {
          console.error(`Organization not found: ${orgId}`)
          return
        }

        const { agents, error } = await window.file.loadOrganizationAgents(organization)
        if (error) {
          console.error('Error loading organization agents:', error)
          return
        }

        setOrganizationAgents((prev) => ({
          ...prev,
          [orgId]: agents
        }))
      } catch (error) {
        console.error('Failed to load organization agents:', error)
      } finally {
        setIsLoadingOrganizationAgents(false)
      }
    },
    [organizationAgents, organizations]
  )

  // すべてのタグをエージェントから抽出（組織エージェントも含む）
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()

    // ディレクトリエージェントからタグを抽出
    directoryAgents.forEach((agent) => {
      if (agent.tags) {
        agent.tags.forEach((tag) => tagSet.add(tag))
      }
    })

    // 組織エージェントからもタグを抽出
    Object.values(organizationAgents).forEach((agents) => {
      agents.forEach((agent) => {
        if (agent.tags) {
          agent.tags.forEach((tag) => tagSet.add(tag))
        }
      })
    })

    return Array.from(tagSet).sort()
  }, [directoryAgents, organizationAgents])

  // タグの選択・解除を処理
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    )
  }, [])

  // すべてのタグをクリア
  const clearTags = useCallback(() => {
    setSelectedTags([])
  }, [])

  // フィルタリングされたエージェントのリスト
  const filteredAgents = useMemo(() => {
    let sourceAgents: CustomAgent[] = []

    switch (selectedOrganization) {
      case 'all':
        // すべてのエージェントを表示（directoryAgents + 全組織のエージェント）
        sourceAgents = [...directoryAgents, ...Object.values(organizationAgents).flat()]
        break
      case 'contributors':
        // コントリビューターのエージェントのみ（既存のdirectoryAgents）
        sourceAgents = directoryAgents
        break
      default:
        // 特定の組織のエージェント
        sourceAgents = organizationAgents[selectedOrganization] || []
        break
    }

    return sourceAgents.filter((agent) => {
      // タグフィルタリング
      const passesTagFilter =
        selectedTags.length === 0 ||
        (agent.tags && selectedTags.every((tag) => agent.tags!.includes(tag)))

      // 検索クエリフィルタリング
      const passesSearchFilter =
        searchQuery === '' ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        false

      return passesTagFilter && passesSearchFilter
    })
  }, [directoryAgents, organizationAgents, selectedOrganization, searchQuery, selectedTags])

  // 選択したエージェントをマイエージェントに追加
  const addSelectedAgentToMyAgents = useCallback(async (): Promise<void> => {
    if (!selectedAgent) {
      throw new Error('No agent selected')
    }

    const success = await addDirectoryAgentToCustom(selectedAgent)
    if (!success) {
      throw new Error('Failed to add agent')
    }
  }, [selectedAgent, addDirectoryAgentToCustom])

  // アプリケーション起動時にディレクトリエージェントを読み込み
  useEffect(() => {
    loadDirectoryAgents()
  }, [])

  // 組織リストが変更された際の処理（削除された組織の状態をクリア）
  useEffect(() => {
    const currentOrgIds = organizations.map((org) => org.id)

    // 削除された組織のキャッシュをクリア
    setOrganizationAgents((prev) => {
      const updatedAgents = { ...prev }
      Object.keys(updatedAgents).forEach((orgId) => {
        if (!currentOrgIds.includes(orgId)) {
          delete updatedAgents[orgId]
        }
      })
      return updatedAgents
    })

    // 現在選択中の組織が削除された場合、'contributors'に切り替え
    if (
      selectedOrganization !== 'all' &&
      selectedOrganization !== 'contributors' &&
      !currentOrgIds.includes(selectedOrganization)
    ) {
      setSelectedOrganization('contributors')
    }
  }, [organizations, selectedOrganization])

  // 総合的なローディング状態を計算
  const isLoading = isDirectoryAgentLoading || isLoadingOrganizationAgents

  // コンテキスト値の作成
  const value: AgentDirectoryContextType = {
    agents: filteredAgents,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedAgent,
    setSelectedAgent,
    addSelectedAgentToMyAgents,
    allTags,
    selectedTags,
    handleTagToggle,
    clearTags,

    // 組織関連の値
    organizationAgents,
    selectedOrganization,
    organizations,
    setSelectedOrganization,
    loadOrganizationAgents
  }

  return <AgentDirectoryContext.Provider value={value}>{children}</AgentDirectoryContext.Provider>
}

// カスタムフック
export const useAgentDirectory = () => {
  const context = useContext(AgentDirectoryContext)
  if (context === undefined) {
    throw new Error('useAgentDirectory must be used within a AgentDirectoryProvider')
  }
  return context
}
