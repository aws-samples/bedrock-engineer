import React from 'react'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import {
  ProjectSection,
  LanguageSection,
  AgentChatSection,
  AWSSection,
  AdvancedSection,
  NotificationSection
} from './components/sections'
import { SoundSection } from './components/sections/SoundSection'
import { ConfigDirSection } from './components/sections/ConfigDirSection'

export const SettingPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const {
    userDataPath,
    projectPath,
    selectDirectory,
    currentLLM,
    updateLLM,
    availableModels,
    sendMsgKey,
    updateSendMsgKey,
    contextLength,
    updateContextLength,
    tavilySearchApiKey,
    setTavilySearchApiKey,
    awsRegion,
    setAwsRegion,
    awsAccessKeyId,
    setAwsAccessKeyId,
    awsSecretAccessKey,
    setAwsSecretAccessKey,
    awsSessionToken,
    setAwsSessionToken,
    inferenceParams,
    updateInferenceParams,
    soundType,
    setSoundType,
    bedrockSettings,
    updateBedrockSettings
  } = useSetting()

  const handleChangeLLM = (modelId: string) => {
    const selectedModel = availableModels.find((model) => model.modelId === modelId)
    if (selectedModel) {
      updateLLM(selectedModel)
    } else {
      console.error(t('Invalid model'))
    }
  }

  const handleChangeLanguage = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage)
    window.store.set('language', newLanguage as any)
  }

  return (
    <div
      className="flex flex-col gap-8 min-w-[320px] max-w-[1024px] mx-auto h-full overflow-y-auto
      dark:text-white md:px-16 px-8 py-6"
    >
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Setting')}</h1>

      <ConfigDirSection userDataPath={userDataPath} />

      <ProjectSection projectPath={projectPath} onSelectDirectory={selectDirectory} />

      <LanguageSection currentLanguage={i18n.language} onChangeLanguage={handleChangeLanguage} />

      <AgentChatSection
        tavilySearchApiKey={tavilySearchApiKey}
        onUpdateTavilySearchApiKey={setTavilySearchApiKey}
        contextLength={contextLength}
        onUpdateContextLength={updateContextLength}
      />

      <AWSSection
        awsRegion={awsRegion}
        awsAccessKeyId={awsAccessKeyId}
        awsSecretAccessKey={awsSecretAccessKey}
        awsSessionToken={awsSessionToken}
        onUpdateRegion={setAwsRegion}
        onUpdateAccessKeyId={setAwsAccessKeyId}
        onUpdateSecretAccessKey={setAwsSecretAccessKey}
        onUpdateSessionToken={setAwsSessionToken}
        currentLLM={currentLLM}
        availableModels={availableModels}
        inferenceParams={inferenceParams}
        bedrockSettings={bedrockSettings}
        onUpdateLLM={handleChangeLLM}
        onUpdateInferenceParams={updateInferenceParams}
        onUpdateBedrockSettings={updateBedrockSettings}
      />

      <SoundSection soundType={soundType} onUpdateSoundType={setSoundType} />

      <AdvancedSection sendMsgKey={sendMsgKey} onUpdateSendMsgKey={updateSendMsgKey} />

      <NotificationSection />
    </div>
  )
}

export default SettingPage
