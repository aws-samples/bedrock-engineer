import React from 'react'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import {
  ProjectSection,
  LanguageSection,
  AgentChatSection,
  AWSSection,
  AdvancedSection,
  NotificationSection,
  GuardrailSettings
} from './components/sections'
import { LightModelSettings } from './components/LightModelSettings'
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
    enablePromptCache,
    setEnablePromptCache,
    requestTimeout,
    setRequestTimeout,
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
    useAwsProfile,
    setUseAwsProfile,
    awsProfile,
    setAwsProfile,
    proxySettings,
    setProxySettings,
    inferenceParams,
    updateInferenceParams,
    bedrockSettings,
    updateBedrockSettings,
    guardrailSettings,
    updateGuardrailSettings
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
        enablePromptCache={enablePromptCache}
        onUpdateEnablePromptCache={setEnablePromptCache}
        requestTimeout={requestTimeout}
        onUpdateRequestTimeout={setRequestTimeout}
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
        useAwsProfile={useAwsProfile}
        onUpdateUseAwsProfile={setUseAwsProfile}
        awsProfile={awsProfile}
        onUpdateAwsProfile={setAwsProfile}
        proxySettings={proxySettings}
        onUpdateProxySettings={setProxySettings}
        currentLLM={currentLLM}
        availableModels={availableModels}
        inferenceParams={inferenceParams}
        bedrockSettings={bedrockSettings}
        onUpdateLLM={handleChangeLLM}
        onUpdateInferenceParams={updateInferenceParams}
        onUpdateBedrockSettings={updateBedrockSettings}
      />

      <GuardrailSettings
        guardrailSettings={guardrailSettings}
        onUpdateGuardrailSettings={updateGuardrailSettings}
      />

      <LightModelSettings />

      <AdvancedSection sendMsgKey={sendMsgKey} onUpdateSendMsgKey={updateSendMsgKey} />

      <NotificationSection />
    </div>
  )
}

export default SettingPage
