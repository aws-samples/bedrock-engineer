import { useEffect, useState } from 'react'
import { SAMPLE_ASL_PARALLEL } from './SAMPLE_ASL'
import AWSSfnGraph from '@tshepomgaga/aws-sfn-graph'
import '@tshepomgaga/aws-sfn-graph/index.css'
import { ASLEditor } from './ASLEditor'
import { useChat } from '@renderer/hooks/useChat'
import { Loader } from '../../components/Loader'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import { motion } from 'framer-motion'
import useModal from '@renderer/hooks/useModal'
import prompts from '@renderer/prompts/prompts'
import MD from '@renderer/components/Markdown/MD'
import { AttachedImage, TextArea } from '../ChatPage/components/InputForm/TextArea'

function StepFunctionsGeneratorPage() {
  const {
    t,
    i18n: { language: lng }
  } = useTranslation()

  const systemPrompt = prompts.StepFunctonsGenerator.system(lng)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_asl, setAsl] = useState(SAMPLE_ASL_PARALLEL)
  const [editorValue, setEditorValue] = useState(JSON.stringify(SAMPLE_ASL_PARALLEL, null, 2))
  const [userInput, setUserInput] = useState('')
  const { currentLLM: llm, sendMsgKey } = useSetting()
  const { messages, handleSubmit, loading, lastText } = useChat({
    systemPrompt,
    modelId: llm.modelId
  })
  const onSubmit = (input: string, images: AttachedImage[]) => {
    handleSubmit(input, images)
    setUserInput('')
  }

  useEffect(() => {
    if (messages !== undefined && messages.length > 0) {
      setEditorValue(lastText)
    }

    if (messages !== undefined && messages.length > 0 && !loading) {
      const lastOne = messages[messages.length - 1]
      const lastMessageText = lastOne?.content[0]?.text
      try {
        const json = JSON.parse(lastMessageText)
        console.log(json)
        setAsl(json)
      } catch (e) {
        console.error(e)
        console.error(lastMessageText)
      }
    }
  }, [messages, loading])

  const [isComposing, setIsComposing] = useState(false)

  useEffect(() => {
    const wfg = document.getElementsByClassName('workflowgraph')[0]
    wfg.className = 'h-full workflowgraph'
  }, [])

  const examples = [
    {
      title: t('Order processing workflow'),
      value: t('Create order processing workflow')
    },
    {
      title: t('7 types of State'),
      value:
        t('Please implement a workflow that combines the following seven types') +
        `

- Task
- Wait
- Pass
- Succeed
- Fail
- Choice
- Parallel`
    },
    {
      title: t('Nested Workflow'),
      value: t('Create Nested Workflow example')
    },
    {
      title: t('User registration process'),
      value: t('Implement the workflow for user registration processing')
    },
    {
      title: t('Distributed Map to process CSV in S3'),
      value: t('Use the distributed map to repeat the row of the CSV file generated in S3')
    }
  ]

  const { Modal: SystemPromptModal, openModal: openSystemPromptModal } = useModal()

  return (
    <div className={'flex flex-col h-[calc(100vh-11rem)] overflow-y-auto z-10'}>
      <SystemPromptModal header="SYSTEM PROMPT" size="7xl">
        <div className="dark:text-white">
          <MD>{systemPrompt}</MD>
        </div>
      </SystemPromptModal>
      <div className="flex pb-2 justify-between">
        <span className="font-bold flex gap-2">
          <h1 className="content-center dark:text-white">AWS Step Functions Generator</h1>
        </span>
        <span
          className="text-xs text-gray-400 font-thin cursor-pointer hover:text-gray-700"
          onClick={openSystemPromptModal}
        >
          SYSTEM_PROMPT
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* LEFT */}
        <div className="border h-[75vh] flex flex-col resize-x bg-white rounded-md dark:bg-gray-800 dark:border-black">
          <div className="border-b p-1">
            <h1 className="text-xs italic dark:text-gray-200">Editor</h1>
          </div>
          <ASLEditor value={editorValue} setValue={setEditorValue} />
        </div>

        {/* RIGHT */}
        <div className="border h-[75vh] flex flex-col resize-x bg-white rounded-md dark:bg-gray-800 dark:border-black">
          <div className="border-b p-1 flex justify-between">
            <h1 className="text-xs italic dark:text-gray-200">Visualizer</h1>
          </div>
          <div>
            <div className="h-[80vh] w-full flex justify-center items-center">
              {loading ? <Loader /> : <AWSSfnGraph data={editorValue} onError={console.log} />}
            </div>
          </div>
        </div>
      </div>

      {/* Buttom Input Field Block */}
      <div className="flex gap-2 fixed bottom-0 left-[5rem] right-5 bottom-3">
        <div className="relative w-full">
          <div className="flex gap-2 justify-between mb-4">
            <div className="overflow-x-auto flex-grow max-w-[100%]">
              <div className="flex flex-nowrap gap-2 min-w-0 whitespace-nowrap">
                {examples.map((e, index) => {
                  return (
                    <motion.button
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.2 }}
                      key={e.title}
                      className="
                      cursor-pointer
                      rounded-full
                      border
                      p-2
                      text-xs
                      text-gray-700
                      dark:text-gray-200
                      hover:border-gray-400
                      hover:bg-gray-100
                      dark:hover:bg-gray-700
                      dark:hover:border-gray-500
                      transition-colors
                      duration-200
                      whitespace-nowrap
                      flex-shrink-0
                    "
                      onClick={() => {
                        setUserInput(e.value)
                      }}
                    >
                      {e.title}
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* prompt input form */}
          <TextArea
            value={userInput}
            onChange={setUserInput}
            disabled={loading}
            onSubmit={(input, attachedImages) => onSubmit(input, attachedImages)}
            isComposing={isComposing}
            setIsComposing={setIsComposing}
            sendMsgKey={sendMsgKey}
          />
        </div>
      </div>
    </div>
  )
}

export default StepFunctionsGeneratorPage
