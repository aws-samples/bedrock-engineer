import { memo, useState } from 'react'
import { EditIcon, RemoveIcon } from '@renderer/components/icons/ToolIcons'
import { useTranslation } from 'react-i18next'
import { AgentCoreGatewayConfigSchemaType } from '@/types/agent-chat.schema'
import { Tool } from '@aws-sdk/client-bedrock-runtime'
import { Spinner } from 'flowbite-react'
import toast from 'react-hot-toast'

interface AgentCoreGatewaySettingFormProps {
  agentCoreGateways: AgentCoreGatewayConfigSchemaType[]
  setAgentCoreGateways: (gateways: AgentCoreGatewayConfigSchemaType[]) => void
}

export const AgentCoreGatewaySettingForm = memo(
  ({ agentCoreGateways, setAgentCoreGateways }: AgentCoreGatewaySettingFormProps) => {
    const { t } = useTranslation()
    const [newEndpoint, setNewEndpoint] = useState('')
    const [newRegion, setNewRegion] = useState('us-east-1')
    const [newProfile, setNewProfile] = useState('default')
    const [newDescription, setNewDescription] = useState('')
    const [editMode, setEditMode] = useState<string | null>(null)
    const [editData, setEditData] = useState<AgentCoreGatewayConfigSchemaType>({
      endpoint: '',
      region: 'us-east-1',
      profile: 'default',
      description: ''
    })

    // Connection test state
    const [isTesting, setIsTesting] = useState(false)
    const [testResult, setTestResult] = useState<{
      endpoint: string
      success: boolean
      message: string
      toolCount?: number
    } | null>(null)

    // Gateway tools state
    const [gatewayTools, setGatewayTools] = useState<Record<string, Tool[]>>({})
    const [isLoadingTools, setIsLoadingTools] = useState<Record<string, boolean>>({})

    const handleTestConnection = async (gateway: AgentCoreGatewayConfigSchemaType) => {
      if (!window.api?.agentcore?.testConnection) {
        toast.error('AgentCore Gateway API not available')
        return
      }

      setIsTesting(true)
      setTestResult(null)

      try {
        const result = await window.api.agentcore.testConnection(gateway)

        setTestResult({
          endpoint: gateway.endpoint,
          success: result.success,
          message: result.message,
          toolCount: result.details?.toolCount
        })

        if (result.success) {
          toast.success(t('Connection successful'))
        } else {
          toast.error(result.message)
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        setTestResult({
          endpoint: gateway.endpoint,
          success: false,
          message: `Connection failed: ${errorMessage}`
        })
        toast.error(errorMessage)
      } finally {
        setIsTesting(false)
      }
    }

    const handleLoadTools = async (gateway: AgentCoreGatewayConfigSchemaType) => {
      if (!window.api?.agentcore?.getTools) {
        toast.error('AgentCore Gateway API not available')
        return
      }

      const key = gateway.endpoint

      setIsLoadingTools((prev) => ({ ...prev, [key]: true }))

      try {
        const tools = await window.api.agentcore.getTools(gateway)

        setGatewayTools((prev) => ({ ...prev, [key]: tools }))

        toast.success(`Loaded ${tools.length} tool${tools.length !== 1 ? 's' : ''}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        toast.error(`Failed to load tools: ${errorMessage}`)
        setGatewayTools((prev) => ({ ...prev, [key]: [] }))
      } finally {
        setIsLoadingTools((prev) => ({ ...prev, [key]: false }))
      }
    }

    const handleAddGateway = () => {
      if (newEndpoint.trim()) {
        const newGateway: AgentCoreGatewayConfigSchemaType = {
          endpoint: newEndpoint.trim(),
          region: newRegion || 'us-east-1',
          profile: newProfile || 'default',
          description: newDescription.trim() || undefined
        }

        setAgentCoreGateways([...agentCoreGateways, newGateway])
        setNewEndpoint('')
        setNewRegion('us-east-1')
        setNewProfile('default')
        setNewDescription('')
        toast.success(t('Gateway added successfully'))
      }
    }

    const handleRemoveGateway = (endpoint: string) => {
      setAgentCoreGateways(agentCoreGateways.filter((gateway) => gateway.endpoint !== endpoint))
      // Clean up related state
      const { [endpoint]: _, ...remainingTools } = gatewayTools
      setGatewayTools(remainingTools)
      toast.success(t('Gateway removed'))
    }

    const handleEditGateway = (gateway: AgentCoreGatewayConfigSchemaType) => {
      setEditMode(gateway.endpoint)
      setEditData({ ...gateway })
    }

    const handleSaveEdit = () => {
      if (editData.endpoint.trim()) {
        setAgentCoreGateways(
          agentCoreGateways.map((gateway) =>
            gateway.endpoint === editMode ? { ...editData } : gateway
          )
        )
        setEditMode(null)
        setEditData({ endpoint: '', region: 'us-east-1', profile: 'default', description: '' })
        toast.success(t('Gateway updated'))
      }
    }

    const handleCancelEdit = () => {
      setEditMode(null)
      setEditData({ endpoint: '', region: 'us-east-1', profile: 'default', description: '' })
    }

    return (
      <div className="mt-4 space-y-4">
        {/* Tool description */}
        <div className="prose dark:prose-invert max-w-none">
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            {t('tool info.agentcore.description')}
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md mb-5">
            <h5 className="font-medium mb-2 dark:text-gray-200">
              {t('tool info.agentcore.about title')}
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('tool info.agentcore.about description')}
            </p>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md mb-5">
            <h5 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">
              {t('tool info.agentcore.requirements title')}
            </h5>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {t('tool info.agentcore.requirements description')}
            </p>
          </div>
        </div>

        {/* Gateway add form */}
        <div className="flex flex-col gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
          <h4 className="font-medium text-sm mb-2 dark:text-gray-200">
            {t('Add New AgentCore Gateway')}
          </h4>
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('Endpoint URL')} *
            </label>
            <input
              type="text"
              value={newEndpoint}
              onChange={(e) => setNewEndpoint(e.target.value)}
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
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
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
                value={newProfile}
                onChange={(e) => setNewProfile(e.target.value)}
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
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="e.g., Production Gateway for weather tools"
              rows={2}
              className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
            />
          </div>
          <button
            onClick={handleAddGateway}
            disabled={!newEndpoint.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {t('Add Gateway')}
          </button>
        </div>

        {/* Registered Gateways list */}
        <div className="space-y-3 mt-6">
          <h4 className="font-medium text-sm dark:text-gray-200">{t('Registered Gateways')}</h4>
          {agentCoreGateways.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('No gateways registered yet')}
            </p>
          ) : (
            agentCoreGateways.map((gateway, index) => {
              const key = gateway.endpoint
              const tools = gatewayTools[key] || []
              const isLoading = isLoadingTools[key] || false

              return (
                <div
                  key={`${gateway.endpoint}-${index}`}
                  className="flex flex-col p-3 text-sm bg-gray-100 dark:bg-gray-900 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
                >
                  {editMode === gateway.endpoint ? (
                    // Edit mode
                    <div className="flex flex-col gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('Endpoint URL')} *
                        </label>
                        <input
                          type="text"
                          value={editData.endpoint}
                          onChange={(e) => setEditData({ ...editData, endpoint: e.target.value })}
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
                            value={editData.region || 'us-east-1'}
                            onChange={(e) => setEditData({ ...editData, region: e.target.value })}
                            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            {t('AWS Profile')}
                          </label>
                          <input
                            type="text"
                            value={editData.profile || 'default'}
                            onChange={(e) => setEditData({ ...editData, profile: e.target.value })}
                            className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                          {t('Description')}
                        </label>
                        <textarea
                          value={editData.description || ''}
                          onChange={(e) =>
                            setEditData({ ...editData, description: e.target.value })
                          }
                          rows={2}
                          className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 resize-vertical"
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!editData.endpoint.trim()}
                          className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {t('Save')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-grow">
                          <div className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                            {gateway.endpoint}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                            <div>
                              {t('Region')}: {gateway.region || 'us-east-1'}
                            </div>
                            <div>
                              {t('Profile')}: {gateway.profile || 'default'}
                            </div>
                            {gateway.description && (
                              <div className="mt-1 text-gray-700 dark:text-gray-300">
                                {gateway.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditGateway(gateway)}
                            className="text-blue-500 hover:text-blue-600 p-1"
                            title={t('Edit')}
                            aria-label="Edit gateway"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleRemoveGateway(gateway.endpoint)}
                            className="text-red-500 hover:text-red-600 p-1"
                            title={t('Remove')}
                            aria-label="Remove gateway"
                          >
                            <RemoveIcon />
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleTestConnection(gateway)}
                          disabled={isTesting}
                          className="px-3 py-1 text-xs text-blue-600 dark:text-blue-400 border border-blue-500 dark:border-blue-400 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isTesting && testResult?.endpoint === gateway.endpoint && (
                            <Spinner size="xs" />
                          )}
                          {t('Test Connection')}
                        </button>
                        <button
                          onClick={() => handleLoadTools(gateway)}
                          disabled={isLoading}
                          className="px-3 py-1 text-xs text-green-600 dark:text-green-400 border border-green-500 dark:border-green-400 rounded hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {isLoading && <Spinner size="xs" />}
                          {t('Load Tools')}
                        </button>
                      </div>

                      {/* Test result display */}
                      {testResult && testResult.endpoint === gateway.endpoint && (
                        <div
                          className={`mt-2 p-2 text-xs rounded ${
                            testResult.success
                              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {testResult.message}
                          {testResult.toolCount !== undefined && (
                            <div className="mt-1">
                              {t('Available tools')}: {testResult.toolCount}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tools list */}
                      {tools.length > 0 && (
                        <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {t('Available Tools')} ({tools.length})
                            </h5>
                          </div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {tools.map((tool, toolIndex) => (
                              <div
                                key={`${tool.toolSpec?.name}-${toolIndex}`}
                                className="p-2 text-xs bg-gray-50 dark:bg-gray-900 rounded"
                              >
                                <div className="font-medium text-gray-800 dark:text-gray-200">
                                  {tool.toolSpec?.name}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 mt-0.5">
                                  {tool.toolSpec?.description}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
)

AgentCoreGatewaySettingForm.displayName = 'AgentCoreGatewaySettingForm'
