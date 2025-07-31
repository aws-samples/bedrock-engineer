import React, { useState } from 'react'
import { Modal, Button } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { HiOfficeBuilding } from 'react-icons/hi'
import { CustomAgent, OrganizationConfig } from '@/types/agent-chat'
import { useSettings } from '@renderer/contexts/SettingsContext'

interface ShareToOrganizationModalProps {
  agent?: CustomAgent
  isOpen: boolean
  onClose: () => void
  onShare: (agent: CustomAgent, organization: OrganizationConfig) => Promise<void>
}

const ShareToOrganizationModal: React.FC<ShareToOrganizationModalProps> = ({
  agent,
  isOpen,
  onClose,
  onShare
}) => {
  const { t } = useTranslation()
  const { organizations } = useSettings()
  const [selectedOrgId, setSelectedOrgId] = useState<string>('')
  const [isSharing, setIsSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleShare = async () => {
    if (!agent || !selectedOrgId) {
      setError(t('pleaseSelectOrganization', 'Please select an organization'))
      return
    }

    const selectedOrg = organizations.find((org) => org.id === selectedOrgId)
    if (!selectedOrg) {
      setError(t('organizationNotFound', 'Organization not found'))
      return
    }

    setIsSharing(true)
    setError(null)

    try {
      await onShare(agent, selectedOrg)
      onClose()
      setSelectedOrgId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unknownError', 'Unknown error occurred'))
    } finally {
      setIsSharing(false)
    }
  }

  const handleClose = () => {
    if (!isSharing) {
      setSelectedOrgId('')
      setError(null)
      onClose()
    }
  }

  if (!agent) return null

  return (
    <Modal show={isOpen} onClose={handleClose} size="md" className="dark:bg-gray-900">
      <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
        <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
          {t('shareAgentToOrganization', 'Share Agent to Organization')}
        </Modal.Header>
        <Modal.Body className="p-0 bg-white dark:bg-gray-900">
          <div className="space-y-4 p-6">
            {/* エージェント情報 */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {t('agentToShare', 'Agent to Share')}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>{agent.name}</strong>
                {agent.description && ` - ${agent.description}`}
              </p>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* 組織選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('selectOrganization', 'Select Organization')}
              </label>

              {organizations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <HiOfficeBuilding className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {t('noOrganizationsConfigured', 'No organizations configured')}
                  </p>
                  <p className="text-xs mt-1">
                    {t(
                      'configureOrganizationsInDirectory',
                      'Configure organizations in Agent Directory'
                    )}
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {organizations.map((org) => (
                    <label
                      key={org.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${
                          selectedOrgId === org.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                    >
                      <input
                        type="radio"
                        name="organization"
                        value={org.id}
                        checked={selectedOrgId === org.id}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="sr-only"
                        disabled={isSharing}
                      />
                      <HiOfficeBuilding className="w-5 h-5 mr-3 text-gray-400" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">{org.name}</div>
                        {org.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {org.description}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          S3: {org.s3Config.bucket}
                          {org.s3Config.prefix && `/${org.s3Config.prefix}`}
                        </div>
                      </div>
                      {selectedOrgId === org.id && (
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 注意事項 */}
            {organizations.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-yellow-800 dark:text-yellow-200 text-xs">
                  <strong>{t('note', 'Note')}:</strong>{' '}
                  {t(
                    'shareToOrganizationNote',
                    "The agent configuration will be uploaded to the selected organization's S3 bucket. Make sure you have proper permissions."
                  )}
                </p>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-b-lg">
          <Button
            onClick={handleShare}
            disabled={isSharing || !selectedOrgId || organizations.length === 0}
            color="blue"
          >
            {isSharing ? t('sharing', 'Sharing...') : t('share', 'Share')}
          </Button>
          <Button color="gray" onClick={handleClose} disabled={isSharing}>
            {t('cancel', 'Cancel')}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export const useShareToOrganizationModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<CustomAgent | undefined>(undefined)

  const openModal = (agent: CustomAgent) => {
    setSelectedAgent(agent)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setSelectedAgent(undefined)
  }

  const handleShare = async (agent: CustomAgent, organization: OrganizationConfig) => {
    try {
      const result = await window.file.saveAgentToOrganization(agent, organization, {
        format: 'yaml'
      })
      if (!result.success) {
        throw new Error(result.error || 'Failed to share agent to organization')
      }
    } catch (error) {
      console.error('Error sharing agent to organization:', error)
      throw error
    }
  }

  const ShareToOrganizationModalComponent = () => (
    <ShareToOrganizationModal
      agent={selectedAgent}
      isOpen={isOpen}
      onClose={closeModal}
      onShare={handleShare}
    />
  )

  return {
    ShareToOrganizationModal: ShareToOrganizationModalComponent,
    openModal,
    closeModal
  }
}
