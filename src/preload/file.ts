import { dialog, OpenDialogOptions } from 'electron'
import { ipcRenderer } from 'electron'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { CustomAgent } from '../types/agent-chat'
import yaml from 'js-yaml'
// 直接storeをインポート
import { store } from './store'

async function readSharedAgents(): Promise<{ agents: CustomAgent[]; error?: Error }> {
  try {
    // 直接importしたstoreを使用
    // Get the project path from the renderer store
    const projectPath = store.get('projectPath')
    if (!projectPath) {
      return { agents: [], error: new Error('Project path not set') }
    }

    // Define the shared agents directory path
    const sharedAgentsDir = path.join(projectPath, '.bedrock-engineer', 'agents')

    // Check if the shared agents directory exists
    try {
      await promisify(fs.access)(sharedAgentsDir)
    } catch (error) {
      return { agents: [] }
    }

    // Read all files in the directory
    const files = await promisify(fs.readdir)(sharedAgentsDir)

    // Filter only yaml files
    const yamlFiles = files.filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))

    // Read and parse each yaml file
    const agents = await Promise.all(
      yamlFiles.map(async (file) => {
        try {
          const filePath = path.join(sharedAgentsDir, file)
          const content = await promisify(fs.readFile)(filePath, 'utf8')
          const agent = yaml.load(content) as CustomAgent

          // Flag this agent as shared
          agent.isShared = true
          return agent
        } catch (error) {
          console.error(`Error parsing agent file ${file}:`, error)
          return null
        }
      })
    )

    // Filter out any nulls from failed parsing
    const validAgents = agents.filter(Boolean) as CustomAgent[]
    return { agents: validAgents }
  } catch (error) {
    return { agents: [], error: error as Error }
  }
}

async function readDirectoryAgents(): Promise<{ agents: CustomAgent[]; error?: Error }> {
  try {
    // Use the embedded directory in dev mode
    const isDev = process.env.NODE_ENV === 'development'

    let agentsDir: string

    if (isDev) {
      // In development, use the source directory
      agentsDir = path.join(process.cwd(), 'src', 'renderer', 'src', 'assets', 'directory-agents')
    } else {
      // In production, use the extraResources path
      // extraResources are copied to <app>/resources/directory-agents in electron-builder.yml
      const appPath = await ipcRenderer.invoke('get-app-path')

      // For packaged app, the directory-agents folder should be in resources folder
      // (parallel to app.asar, not inside it)
      const resourcesPath = path.dirname(appPath)
      agentsDir = path.join(resourcesPath, 'directory-agents')

      console.log('Production directory agents path:', agentsDir)
    }

    // Check if the directory agents directory exists
    try {
      await promisify(fs.access)(agentsDir)
    } catch (error) {
      console.log(`Directory agents directory not found: ${agentsDir}`)
      return { agents: [] }
    }

    // Read all files in the directory
    const files = await promisify(fs.readdir)(agentsDir)

    // Filter only yaml files
    const yamlFiles = files.filter((file) => file.endsWith('.yaml') || file.endsWith('.yml'))

    // Read and parse each yaml file
    const agents = await Promise.all(
      yamlFiles.map(async (file) => {
        try {
          const filePath = path.join(agentsDir, file)
          const content = await promisify(fs.readFile)(filePath, 'utf8')
          const agent = yaml.load(content) as CustomAgent

          // Flag this agent as a directory agent
          agent.directoryOnly = true
          agent.isShared = false
          agent.isCustom = false

          return agent
        } catch (error) {
          console.error(`Error parsing agent file ${file}:`, error)
          return null
        }
      })
    )

    // Filter out any nulls from failed parsing
    const validAgents = agents.filter(Boolean) as CustomAgent[]
    return { agents: validAgents }
  } catch (error) {
    return { agents: [], error: error as Error }
  }
}

export async function handleFileOpen(options: OpenDialogOptions) {
  const { canceled, filePaths } = await dialog.showOpenDialog(options)
  if (!canceled) {
    return filePaths[0]
  }
  return undefined
}

/**
 * Save an agent as a shared agent to the project's .bedrock-engineer/agents directory
 * @param agent The agent to save
 * @param options Optional settings for saving (format)
 * @returns Result with success status and path/error details
 */
async function saveSharedAgent(
  agent: CustomAgent,
  options?: { format?: 'json' | 'yaml' }
): Promise<{ success: boolean; filePath?: string; format?: string; error?: string }> {
  try {
    // Use IPC to let main process handle file operations
    return await ipcRenderer.invoke('save-shared-agent', agent, options)
  } catch (error) {
    console.error('Error saving shared agent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Load organization agents from S3
 * @param organizationConfig The organization configuration
 * @returns Result with agents and error details
 */
async function loadOrganizationAgents(
  organizationConfig: any
): Promise<{ agents: CustomAgent[]; error?: string }> {
  try {
    return await ipcRenderer.invoke('load-organization-agents', organizationConfig)
  } catch (error) {
    console.error('Error loading organization agents:', error)
    return {
      agents: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Save an agent to organization S3
 * @param agent The agent to save
 * @param organizationConfig The organization configuration
 * @param options Optional settings for saving (format)
 * @returns Result with success status and details
 */
async function saveAgentToOrganization(
  agent: CustomAgent,
  organizationConfig: any,
  options?: { format?: 'json' | 'yaml' }
): Promise<{ success: boolean; s3Key?: string; format?: string; error?: string }> {
  try {
    return await ipcRenderer.invoke(
      'save-agent-to-organization',
      agent,
      organizationConfig,
      options
    )
  } catch (error) {
    console.error('Error saving agent to organization:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export const file = {
  handleFolderOpen: () => ipcRenderer.invoke('open-directory'),
  handleFileOpen: () => ipcRenderer.invoke('open-file'),
  readSharedAgents,
  readDirectoryAgents,
  saveSharedAgent,
  loadOrganizationAgents,
  saveAgentToOrganization
}

export default file
