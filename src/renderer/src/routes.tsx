import { FiHome, FiFeather, FiSettings, FiMic } from 'react-icons/fi'
import { LuCombine } from 'react-icons/lu'
import { HiOutlineChatAlt2 } from 'react-icons/hi'
import { BsLayoutWtf } from 'react-icons/bs'
import HomePage from './pages/HomePage/HomePage'
import SettingPage from './pages/SettingPage/SettingPage'
import StepFunctionsGeneratorPage from './pages/StepFunctionsGeneratorPage/StepFunctionsGeneratorPage'
import WebsiteGeneratorPage from './pages/WebsiteGeneratorPage/WebsiteGeneratorPage'
import ChatPage from './pages/ChatPage/ChatPage'
import DiagramGeneratorPage from './pages/DiagramGeneratorPage/DiagramGeneratorPage'
import { AgentDirectoryPage } from './pages/AgentDirectoryPage/AgentDirectoryPage'
import SpeakPage from './pages/SpeakPage'
import { LuBookDown } from 'react-icons/lu'

export const routeCategories = [
  {
    category: 'Home',
    routes: [
      {
        name: 'Home',
        href: '/',
        icon: FiHome,
        position: 'top',
        element: <HomePage />
      }
    ]
  },
  {
    category: 'チャット',
    routes: [
      {
        name: 'Chat',
        href: '/chat',
        icon: HiOutlineChatAlt2,
        position: 'top',
        element: <ChatPage />
      },
      {
        name: 'Voice Chat',
        href: '/speak',
        icon: FiMic,
        position: 'top',
        element: <SpeakPage />
      }
    ]
  },
  {
    category: 'ツール',
    routes: [
      {
        name: 'Website Generator',
        href: '/generative-ui',
        icon: FiFeather,
        position: 'top',
        element: <WebsiteGeneratorPage />
      },
      {
        name: 'Step Functions Generator',
        href: '/step-functions-generator',
        icon: LuCombine,
        position: 'top',
        element: <StepFunctionsGeneratorPage />
      },
      {
        name: 'Diagram Generator',
        href: '/diagram-generator',
        icon: BsLayoutWtf,
        position: 'top',
        element: <DiagramGeneratorPage />
      }
    ]
  },
  {
    category: '管理',
    routes: [
      {
        name: 'Agent Directory',
        href: '/agent-directory',
        icon: LuBookDown,
        position: 'top',
        element: <AgentDirectoryPage />
      },
      {
        name: 'Setting',
        href: '/setting',
        icon: FiSettings,
        position: 'top',
        element: <SettingPage />
      }
    ]
  }
]

// 既存のroutesも互換性のために残しておく
export const routes = routeCategories.flatMap((category) => category.routes)
