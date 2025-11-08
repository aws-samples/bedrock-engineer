import React, { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentCoreGatewayConfigSchemaType } from '@/types/agent-chat.schema'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import toast from 'react-hot-toast'

interface AgentCoreGatewaySectionProps {
  agentCoreGateways: AgentCoreGatewayConfigSchemaType[]
  onChange: (gateways: AgentCoreGatewayConfigSchemaType[]) => void
  onToolsLoaded?: (tools: Tool[]) => void
}

/**
 * AgentCore Gateway設定セクションのメインコンポーネント
 */
export const AgentCoreGatewaySection: React.FC<AgentCoreGatewaySectionProps> = ({
  agentCoreGateways,
  onChange,
  onToolsLoaded
}) => {
  const { t } = useTranslation()

  // Form state
  const [endpoint, setEndpoint] = useState('')
  const [region, setRegion] = useState('us-east-1')
  const [profile, setProfile] = useState('default')
  const [description, setDescription] = useState('')
  const [editMode, setEditMode] = useState<string | null>(null)

  // Connection test state
  const [testingConnection, setTestingConnection] = useState<Record<string, boolean>>({})
  const [loadingTools, setLoadingTools] = useState<Record<string, boolean>>({})
  const [connectionResults, setConnectionResults] = useState<Record<string, any>>({})
  const [loadedTools, setLoadedTools] = useState<Record<string, Tool[]>>({})

  const handleLoadTools = useCallback(
    async (gateway: AgentCoreGatewayConfigSchemaType) => {
      const key = gateway.endpoint
      setLoadingTools((prev) => ({ ...prev, [key]: true }))

      try {
        const tools = await window.api.agentcore.getTools(gateway)

        // ツール一覧を保存
        setLoadedTools((prev) => ({ ...prev, [key]: tools }))

        if (onToolsLoaded) {
          onToolsLoaded(tools)
        }

        toast.success(t('Loaded {{count}} tool(s)', { count: tools.length }))
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        toast.error(`Failed to load tools: ${errorMessage}`)
        setLoadedTools((prev) => ({ ...prev, [key]: [] }))
      } finally {
        setLoadingTools((prev) => ({ ...prev, [key]: false }))
      }
    },
    [onToolsLoaded, t]
  )

  const handleAdd = useCallback(() => {
    if (!endpoint.trim()) {
      toast.error(t('Endpoint URL is required'))
      return
    }

    const newGateway: AgentCoreGatewayConfigSchemaType = {
      endpoint: endpoint.trim(),
      region: region || 'us-east-1',
      profile: profile || 'default',
      description: description.trim() || undefined
    }

    onChange([...agentCoreGateways, newGateway])

    // Reset form
    setEndpoint('')
    setRegion('us-east-1')
    setProfile('default')
    setDescription('')

    toast.success(t('Gateway added successfully'))

    // 自動的にツールを読み込む
    setTimeout(() => {
      handleLoadTools(newGateway)
    }, 100)
  }, [endpoint, region, profile, description, agentCoreGateways, onChange, t, handleLoadTools])

  const handleDelete = useCallback(
    (endpointToDelete: string) => {
      onChange(agentCoreGateways.filter((gw) => gw.endpoint !== endpointToDelete))
      toast.success(t('Gateway removed'))
    },
    [agentCoreGateways, onChange, t]
  )

  const handleEdit = useCallback((gateway: AgentCoreGatewayConfigSchemaType) => {
    setEditMode(gateway.endpoint)
    setEndpoint(gateway.endpoint)
    setRegion(gateway.region || 'us-east-1')
    setProfile(gateway.profile || 'default')
    setDescription(gateway.description || '')
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (!endpoint.trim()) {
      toast.error(t('Endpoint URL is required'))
      return
    }

    const updatedGateway: AgentCoreGatewayConfigSchemaType = {
      endpoint: endpoint.trim(),
      region: region || 'us-east-1',
      profile: profile || 'default',
      description: description.trim() || undefined
    }

    const updatedGateways = agentCoreGateways.map((gw) =>
      gw.endpoint === editMode ? updatedGateway : gw
    )

    onChange(updatedGateways)
    setEditMode(null)
    setEndpoint('')
    setRegion('us-east-1')
    setProfile('default')
    setDescription('')

    toast.success(t('Gateway updated'))

    // エンドポイントが変更された場合は自動的にツールを再読み込み
    const originalGateway = agentCoreGateways.find((gw) => gw.endpoint === editMode)
    if (originalGateway && originalGateway.endpoint !== updatedGateway.endpoint) {
      setTimeout(() => {
        handleLoadTools(updatedGateway)
      }, 100)
    }
  }, [
    editMode,
    endpoint,
    region,
    profile,
    description,
    agentCoreGateways,
    onChange,
    t,
    handleLoadTools
  ])

  const handleCancelEdit = useCallback(() => {
    setEditMode(null)
    setEndpoint('')
    setRegion('us-east-1')
    setProfile('default')
    setDescription('')
  }, [])

  const handleTestConnection = useCallback(
    async (gateway: AgentCoreGatewayConfigSchemaType) => {
      const key = gateway.endpoint
      setTestingConnection((prev) => ({ ...prev, [key]: true }))

      try {
        const result = await window.api.agentcore.testConnection(gateway)
        setConnectionResults((prev) => ({ ...prev, [key]: result }))

        if (result.success) {
          toast.success(t('Connection successful'))
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setConnectionResults((prev) => ({
          ...prev,
          [key]: { success: false, message: errorMessage }
        }))
        toast.error(errorMessage)
      } finally {
        setTestingConnection((prev) => ({ ...prev, [key]: false }))
      }
    },
    [t]
  )

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
        {t('AgentCore Gateway Settings')}
      </h3>

      <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-md mb-4 border border-gray-200 dark:border-gray-700/50">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {t('Configure AgentCore Gateway endpoints for this agent to use gateway tools.')}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {t('Register gateways first, then load tools to enable them in the Available Tools tab.')}
        </p>
      </div>

      {/* Gateway List */}
      {agentCoreGateways.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm dark:text-gray-200">{t('Registered Gateways')}</h4>
          {agentCoreGateways.map((gateway) => {
            const key = gateway.endpoint
            const isTesting = testingConnection[key]
            const isLoading = loadingTools[key]
            const testResult = connectionResults[key]

            return (
              <div
                key={key}
                className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-grow">
                    <div className="font-medium text-sm text-gray-800 dark:text-gray-200">
                      {gateway.endpoint}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {t('Region')}: {gateway.region || 'us-east-1'} | {t('Profile')}:{' '}
                      {gateway.profile || 'default'}
                    </div>
                    {gateway.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {gateway.description}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(gateway)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {t('Edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(gateway.endpoint)}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      {t('Remove')}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleTestConnection(gateway)}
                    disabled={isTesting}
                    className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 disabled:opacity-50"
                  >
                    {isTesting ? t('Testing...') : t('Test Connection')}
                  </button>
                  <button
                    onClick={() => handleLoadTools(gateway)}
                    disabled={isLoading}
                    className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50"
                  >
                    {isLoading ? t('Loading...') : t('Load Tools')}
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`mt-2 p-2 text-xs rounded ${
                      testResult.success
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {testResult.message}
                  </div>
                )}

                {/* ツール一覧表示 */}
                {loadedTools[key] && loadedTools[key].length > 0 && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('Available Tools')} ({loadedTools[key].length})
                    </h5>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {loadedTools[key].map((tool, toolIndex) => (
                        <div
                          key={`${tool.toolSpec?.name}-${toolIndex}`}
                          className="p-2 text-xs bg-gray-50 dark:bg-gray-900 rounded"
                        >
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {tool.toolSpec?.name}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {tool.toolSpec?.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Form */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900">
        <h4 className="font-medium text-sm mb-3 dark:text-gray-200">
          {editMode ? t('Edit Gateway') : t('Add New Gateway')}
        </h4>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('Endpoint URL')} *
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://xxx.execute-api.us-east-1.amazonaws.com/prod"
              className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('Region')}
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="us-east-1"
                className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t('AWS Profile')}
              </label>
              <input
                type="text"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="default"
                className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('Description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('Optional description for this gateway')}
              rows={2}
              className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
            />
          </div>

          <div className="flex gap-2">
            {editMode ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  disabled={!endpoint.trim()}
                  className="flex-1 px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {t('Save')}
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {t('Cancel')}
                </button>
              </>
            ) : (
              <button
                onClick={handleAdd}
                disabled={!endpoint.trim()}
                className="w-full px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {t('Add Gateway')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
