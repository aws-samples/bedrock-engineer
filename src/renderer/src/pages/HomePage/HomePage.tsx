import Lottie from 'lottie-react'
import robotAnimation from './Robot.json'
import { Kbd } from 'flowbite-react'
import { useTranslation } from 'react-i18next'
import useSetting from '@renderer/hooks/useSetting'
import { motion } from 'framer-motion'
import { useTour } from '@reactour/tour'
import { useState, useEffect } from 'react'

const HomePage = () => {
  const { t } = useTranslation()
  const { awsRegion, awsAccessKeyId, awsSecretAccessKey } = useSetting()
  const isInitLoad = !awsRegion || !awsAccessKeyId || !awsSecretAccessKey

  // Array of message keys for random selection
  const messageKeys = [
    'This is AI assistant of software development tasks',
    'This is AI assistant for business analysis and planning',
    'This is AI assistant for content creation and documentation',
    'This is AI assistant for data analysis and visualization',
    'This is AI assistant for project management and organization',
    'This is AI assistant that helps streamline your workflow',
    'This is AI assistant for creative problem solving',
    'This is AI assistant for research and information gathering'
  ]

  // State for the current message index
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)

  // Cycle through messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messageKeys.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [messageKeys.length])

  const textanimate = (text: string, delay?: number, animationKey?: number) =>
    text.split('').map((word, index) => {
      const duration = (animationKey || 0) > 0 ? 1.0 : 0.2
      return (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration, delay: (delay || 0) + index * 0.01 }}
          key={`${animationKey || 0}-${index}`}
        >
          {word}
        </motion.span>
      )
    })

  const { setIsOpen } = useTour()

  return (
    <div className="flex flex-col gap-3 justify-center align-center items-center h-full">
      {/* https://app.lottiefiles.com/animation/aae1bb98-eced-420a-99ea-022e281fb845?channel=web&source=public-animation&panel=download */}
      <Lottie animationData={robotAnimation} className="w-[12rem]" />

      <span
        onClick={() => {
          throw new Error('error')
        }}
        className="text-gray-400 text-lg"
      >
        {textanimate(t('Welcome to Bedrock Engineer') + ' ' + '👋')}
      </span>

      <div className="flex flex-col gap-2 justify-center align-center items-center">
        <span className="text-gray-400 text-sm">
          {textanimate(t(messageKeys[currentMessageIndex]), 0.5, currentMessageIndex)}
        </span>
        <motion.span
          className="text-gray-400 text-xs"
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 1.0 }}
        >
          {t('Start by the menu on the left or')} <Kbd className="bg-gray-200">⌘</Kbd> +{' '}
          <Kbd className="bg-gray-200">K</Kbd>.
        </motion.span>
      </div>
      {!isInitLoad && (
        <motion.button
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, duration: 1.0 }}
          className="text-sm font-bold bg-gradient-to-bl from-green-400 to-blue-700 bg-clip-text text-transparent leading-normal hover:text-blue-700"
          onClick={() => setIsOpen(true)}
        >
          Open Tour
        </motion.button>
      )}
    </div>
  )
}

export default HomePage
