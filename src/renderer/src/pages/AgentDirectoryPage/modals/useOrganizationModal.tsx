import React, { useState } from 'react'
import { Modal, Button, Label, TextInput, Textarea, Select } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import { OrganizationConfig } from '@/types/agent-chat'
import { useSettings } from '@renderer/contexts/SettingsContext'
import { AWS_REGIONS } from '@/types/aws-regions'
import { HiExclamationTriangle } from 'react-icons/hi2'
import { useToast } from '@renderer/hooks/useToast'

interface OrganizationModalProps {
  organization?: OrganizationConfig
  isOpen: boolean
  onClose: () => void
}

interface DeleteConfirmModalProps {
  organization: OrganizationConfig
  isOpen: boolean
  onClose: () => void
  onConfirmDelete: () => Promise<void>
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  organization,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const { t } = useTranslation()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onConfirmDelete()
      onClose()
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal show={isOpen} onClose={onClose} size="md" className="dark:bg-gray-900">
      <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
        <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
          {t('organization.deleteConfirmTitle')}
        </Modal.Header>
        <Modal.Body className="p-0 bg-white dark:bg-gray-900">
          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <HiExclamationTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-gray-100 mb-2">
                  <strong>{organization.name}</strong>
                </p>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                  {t('organization.deleteConfirmMessage')}
                </p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-b-lg">
          <Button onClick={handleDelete} disabled={isDeleting} color="failure">
            {isDeleting ? t('organization.saving') : t('organization.delete')}
          </Button>
          <Button color="gray" onClick={onClose} disabled={isDeleting}>
            {t('organization.cancel')}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

const OrganizationModal: React.FC<OrganizationModalProps> = ({ organization, isOpen, onClose }) => {
  const { t } = useTranslation()
  const { addOrganization, updateOrganization } = useSettings()
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: organization?.name || '',
    description: organization?.description || '',
    s3Config: {
      bucket: organization?.s3Config.bucket || '',
      prefix: organization?.s3Config.prefix || '',
      region: organization?.s3Config.region || 'us-east-1'
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    // バリデーション
    if (!formData.name.trim()) {
      setError(t('organization.organizationNameRequired'))
      return
    }

    if (!formData.s3Config.bucket.trim()) {
      setError(t('organization.s3BucketRequired'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const organizationData: OrganizationConfig = {
        id: organization?.id || `org-${Date.now()}`,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        s3Config: {
          bucket: formData.s3Config.bucket.trim(),
          prefix: formData.s3Config.prefix.trim() || undefined,
          region: formData.s3Config.region
        }
      }

      if (organization) {
        updateOrganization(organizationData)
        toast.success(t('organization.toast.organizationUpdated', { name: organizationData.name }))
      } else {
        addOrganization(organizationData)
        toast.success(t('organization.toast.organizationAdded', { name: organizationData.name }))
      }

      onClose()
      // フォームリセット
      setFormData({
        name: '',
        description: '',
        s3Config: {
          bucket: '',
          prefix: '',
          region: 'us-east-1'
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('organization.unknownError')
      setError(errorMessage)
      toast.error(t('organization.toast.organizationError', { error: errorMessage }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!organization) {
      // 新規作成の場合のみフォームリセット
      setFormData({
        name: '',
        description: '',
        s3Config: {
          bucket: '',
          prefix: '',
          region: 'us-east-1'
        }
      })
    }
    setError(null)
    onClose()
  }

  return (
    <Modal show={isOpen} onClose={handleClose} size="lg" className="dark:bg-gray-900">
      <div className="border-[0.5px] border-white dark:border-gray-100 rounded-lg shadow-xl dark:shadow-gray-900/80">
        <Modal.Header className="border-b border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-t-lg">
          {organization ? t('organization.editOrganization') : t('organization.addOrganization')}
        </Modal.Header>
        <Modal.Body className="p-0 bg-white dark:bg-gray-900">
          <div className="space-y-4 p-6">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* 組織名 */}
            <div>
              <Label htmlFor="orgName">
                {t('organization.organizationName')} <span className="text-red-500">*</span>
              </Label>
              <TextInput
                id="orgName"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t('organization.enterOrganizationName')}
                required
                disabled={isLoading}
              />
            </div>

            {/* 説明 */}
            <div>
              <Label htmlFor="orgDesc">{t('organization.description')}</Label>
              <Textarea
                id="orgDesc"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder={t('organization.enterDescription')}
                rows={2}
                disabled={isLoading}
              />
            </div>

            {/* 組織の説明文 */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('organization.organizationSetupDescription')}
              </p>
            </div>

            {/* S3設定 */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t('organization.s3Settings')}
                </h3>
                <a
                  href={`https://${formData.s3Config.region}.console.aws.amazon.com/s3/home?region=${formData.s3Config.region}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  {t('organization.openS3Console')}
                </a>
              </div>

              {/* S3バケット */}
              <div className="mb-3">
                <Label htmlFor="s3Bucket">
                  {t('organization.s3Bucket')} <span className="text-red-500">*</span>
                </Label>
                <TextInput
                  id="s3Bucket"
                  value={formData.s3Config.bucket}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      s3Config: { ...prev.s3Config, bucket: e.target.value }
                    }))
                  }
                  placeholder="my-organization-agents"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* リージョン */}
              <div className="mb-3">
                <Label htmlFor="s3Region">{t('organization.awsRegion')}</Label>
                <Select
                  id="s3Region"
                  value={formData.s3Config.region}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      s3Config: { ...prev.s3Config, region: e.target.value }
                    }))
                  }
                  disabled={isLoading}
                >
                  {AWS_REGIONS.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* パスプリフィックス */}
              <div>
                <Label htmlFor="s3Prefix">{t('organization.pathPrefix')}</Label>
                <TextInput
                  id="s3Prefix"
                  value={formData.s3Config.prefix}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      s3Config: { ...prev.s3Config, prefix: e.target.value }
                    }))
                  }
                  placeholder="agents/"
                  disabled={isLoading}
                  helperText={t('organization.pathPrefixHelper')}
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-t border-gray-200 dark:border-gray-700/50 dark:bg-gray-900 rounded-b-lg">
          <Button onClick={handleSave} disabled={isLoading} color="blue">
            {isLoading
              ? t('organization.saving')
              : organization
                ? t('organization.update')
                : t('organization.add')}
          </Button>
          <Button color="gray" onClick={handleClose} disabled={isLoading}>
            {t('organization.cancel')}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export const useOrganizationModal = () => {
  const { t } = useTranslation()
  const { removeOrganization } = useSettings()
  const toast = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<OrganizationConfig | undefined>(
    undefined
  )

  // 削除確認モーダル用の状態
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingOrganization, setDeletingOrganization] = useState<OrganizationConfig | undefined>(
    undefined
  )

  const openModal = (organization?: OrganizationConfig) => {
    setEditingOrganization(organization)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
    setEditingOrganization(undefined)
  }

  const openDeleteModal = (organization: OrganizationConfig) => {
    setDeletingOrganization(organization)
    setIsDeleteOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteOpen(false)
    setDeletingOrganization(undefined)
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deletingOrganization) return

    try {
      const organizationName = deletingOrganization.name
      removeOrganization(deletingOrganization.id)
      toast.success(t('organization.toast.organizationDeleted', { name: organizationName }))
      // 削除成功後はAgentDirectoryContextで選択中組織の処理が必要
    } catch (error) {
      console.error('Failed to delete organization:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(t('organization.toast.organizationError', { error: errorMessage }))
      throw error
    }
  }

  const OrganizationModalComponent = () => (
    <>
      <OrganizationModal organization={editingOrganization} isOpen={isOpen} onClose={closeModal} />
      {deletingOrganization && (
        <DeleteConfirmModal
          organization={deletingOrganization}
          isOpen={isDeleteOpen}
          onClose={closeDeleteModal}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </>
  )

  return {
    OrganizationModal: OrganizationModalComponent,
    openModal,
    closeModal,
    openDeleteModal,
    closeDeleteModal
  }
}
