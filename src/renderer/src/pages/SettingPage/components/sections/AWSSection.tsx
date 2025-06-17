import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FcKey, FcElectronics, FcMindMap } from 'react-icons/fc'
import { IoMdClose } from 'react-icons/io'
import { SettingSection } from '../SettingSection'
import { SettingInput } from '../SettingInput'
import { SettingSelect } from '../SettingSelect'
import { IAMPolicyModal } from '../IAMPolicyModal'
import { ThinkingModeSettings } from '../ThinkingModeSettings'
import { AWS_REGIONS } from '@/types/aws-regions'
import { LLM } from '@/types/llm'
import { NovaSonicStatus } from '../NovaSonicStatus'

interface AWSSectionProps {
  // AWS Basic Settings
  awsRegion: string
  awsAccessKeyId: string
  awsSecretAccessKey: string
  awsSessionToken: string
  onUpdateRegion: (region: string) => void
  onUpdateAccessKeyId: (id: string) => void
  onUpdateSecretAccessKey: (key: string) => void
  onUpdateSessionToken: (token: string) => void

  // AWS Profile Settings
  useAwsProfile: boolean
  onUpdateUseAwsProfile: (useProfile: boolean) => void
  awsProfile: string
  onUpdateAwsProfile: (profile: string) => void

  // Bedrock Settings
  currentLLM: LLM
  availableModels: LLM[]
  inferenceParams: {
    maxTokens: number
    temperature: number
    topP?: number
  }
  bedrockSettings: {
    enableRegionFailover: boolean
    availableFailoverRegions: string[]
  }
  onUpdateLLM: (modelId: string) => void
  onUpdateInferenceParams: (params: Partial<AWSSectionProps['inferenceParams']>) => void
  onUpdateBedrockSettings: (settings: Partial<AWSSectionProps['bedrockSettings']>) => void
}

export const AWSSection: React.FC<AWSSectionProps> = ({
  // AWS Basic Settings
  awsRegion,
  awsAccessKeyId,
  awsSecretAccessKey,
  awsSessionToken,
  onUpdateRegion,
  onUpdateAccessKeyId,
  onUpdateSecretAccessKey,
  onUpdateSessionToken,

  // AWS Profile Settings
  useAwsProfile,
  onUpdateUseAwsProfile,
  awsProfile,
  onUpdateAwsProfile,

  // Bedrock Settings
  currentLLM,
  availableModels,
  inferenceParams,
  bedrockSettings,
  onUpdateLLM,
  onUpdateInferenceParams,
  onUpdateBedrockSettings
}) => {
  const { t } = useTranslation()
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false)

  const regionGroups = [
    {
      label: t('Bedrock Supported Regions'),
      options: AWS_REGIONS.filter((region) => region.bedrockSupported).map((region) => ({
        value: region.id,
        label: `${region.name} (${region.id})`
      }))
    },
    {
      label: t('Other Regions'),
      options: AWS_REGIONS.filter((region) => !region.bedrockSupported).map((region) => ({
        value: region.id,
        label: `${region.name} (${region.id})`
      }))
    }
  ]

  const modelOptions = availableModels.map((model) => ({
    value: model.modelId,
    label: model.modelName
  }))

  // Bedrock対応リージョンのみをフィルタリング
  const bedrockRegions = AWS_REGIONS.filter((region) => region.bedrockSupported)

  const handleRegionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRegion = e.target.value
    if (selectedRegion && !bedrockSettings.availableFailoverRegions.includes(selectedRegion)) {
      onUpdateBedrockSettings({
        availableFailoverRegions: [...bedrockSettings.availableFailoverRegions, selectedRegion]
      })
    }
  }

  const handleRemoveRegion = (regionToRemove: string) => {
    onUpdateBedrockSettings({
      availableFailoverRegions: bedrockSettings.availableFailoverRegions.filter(
        (region) => region !== regionToRemove
      )
    })
  }

  const handleFailoverToggle = (checked: boolean) => {
    if (!checked) {
      // フェイルオーバーを無効にする場合は、選択されているリージョンをクリア
      onUpdateBedrockSettings({
        enableRegionFailover: false,
        availableFailoverRegions: []
      })
    } else {
      onUpdateBedrockSettings({
        enableRegionFailover: true
      })
    }
  }

  return (
    <>
      <SettingSection title={t('AWS Settings')} icon={FcKey}>
        <div className="space-y-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t('This application requires specific IAM permissions to access Amazon Bedrock.')}{' '}
            <button
              onClick={() => setIsPolicyModalOpen(true)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t('View required IAM policies')}
            </button>
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300
                    focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
                    focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={useAwsProfile}
                  onChange={(e) => onUpdateUseAwsProfile(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('Use AWS Profile')}
                </span>
              </label>
            </div>

            {useAwsProfile ? (
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {t('Use credentials from ~/.aws')}
                </p>

                <SettingInput
                  label={t('AWS Profile Name')}
                  type="string"
                  placeholder="default"
                  value={awsProfile}
                  onChange={(e) => onUpdateAwsProfile(e.target.value)}
                />

                <SettingSelect
                  label={t('AWS Region')}
                  value={awsRegion}
                  options={[{ value: '', label: t('Select a region') }]}
                  groups={regionGroups}
                  onChange={(e) => onUpdateRegion(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                <SettingInput
                  label={t('AWS Access Key ID')}
                  type="string"
                  placeholder="AKXXXXXXXXXXXXXXXXXX"
                  value={awsAccessKeyId}
                  onChange={(e) => onUpdateAccessKeyId(e.target.value)}
                />

                <SettingInput
                  label={t('AWS Secret Access Key')}
                  type="password"
                  placeholder="****************************************"
                  value={awsSecretAccessKey}
                  onChange={(e) => onUpdateSecretAccessKey(e.target.value)}
                />

                <SettingInput
                  label={t('AWS Session Token (optional)')}
                  type="password"
                  placeholder="****************************************"
                  value={awsSessionToken}
                  onChange={(e) => onUpdateSessionToken(e.target.value)}
                />

                <SettingSelect
                  label={t('AWS Region')}
                  value={awsRegion}
                  options={[{ value: '', label: t('Select a region') }]}
                  groups={regionGroups}
                  onChange={(e) => onUpdateRegion(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </SettingSection>

      <SettingSection title={t('Voice Chat Status')} icon={FcElectronics}>
        <NovaSonicStatus currentRegion={awsRegion} />
      </SettingSection>

      <SettingSection title={t('Amazon Bedrock')} icon={FcElectronics}>
        <div className="space-y-4">
          <SettingSelect
            label={t('LLM (Large Language Model)')}
            value={currentLLM?.modelId}
            options={modelOptions}
            onChange={(e) => onUpdateLLM(e.target.value)}
          />

          <div className="space-y-2">
            <div className="space-y-4">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300
                    focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800
                    focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  checked={bedrockSettings.enableRegionFailover}
                  onChange={(e) => handleFailoverToggle(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  {t('Enable Region Failover on ThrottlingException')}
                </span>
              </label>

              {bedrockSettings.enableRegionFailover && (
                <div className="ml-7 space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('Failover Regions')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {t(
                      'Select regions to be used as failover targets when ThrottlingException occurs'
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {bedrockSettings.availableFailoverRegions.map((region) => {
                      const regionInfo = bedrockRegions.find((r) => r.id === region)
                      return (
                        <div
                          key={region}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm
                            bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        >
                          <span>{regionInfo ? `${regionInfo.name} (${region})` : region}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRegion(region)}
                            className="ml-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800
                              dark:hover:text-blue-200"
                          >
                            <IoMdClose className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  <select
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600
                      focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600
                      sm:text-sm rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    value=""
                    onChange={handleRegionSelect}
                  >
                    <option value="">{t('Add a failover region')}</option>
                    {bedrockRegions
                      .filter(
                        (region) => !bedrockSettings.availableFailoverRegions.includes(region.id)
                      )
                      .filter((region) => region.id !== awsRegion)
                      .map((region) => (
                        <option key={region.id} value={region.id}>
                          {t(region.name)} ({region.id})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingSection>

      <SettingSection title={t('Inference Parameters')} icon={FcMindMap}>
        <div className="space-y-4">
          <SettingInput
            label={t('Max Tokens')}
            type="number"
            placeholder={t('Max tokens')}
            value={inferenceParams.maxTokens}
            min={1}
            max={4096}
            onChange={(e) => {
              onUpdateInferenceParams({ maxTokens: parseInt(e.target.value, 10) })
            }}
          />

          <SettingInput
            label={t('Temperature')}
            type="number"
            placeholder={t('Temperature')}
            value={inferenceParams.temperature}
            min={0}
            max={1.0}
            step={0.1}
            onChange={(e) => {
              onUpdateInferenceParams({ temperature: parseFloat(e.target.value) })
            }}
          />

          <SettingInput
            label={t('topP')}
            type="number"
            placeholder={t('topP')}
            value={inferenceParams.topP}
            min={0}
            max={1}
            step={0.1}
            onChange={(e) => {
              onUpdateInferenceParams({ topP: parseFloat(e.target.value) })
            }}
          />

          <ThinkingModeSettings />
        </div>
      </SettingSection>

      <IAMPolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />
    </>
  )
}
