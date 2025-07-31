import { IpcMainInvokeEvent } from 'electron'
import { resolve } from 'path'
import fs from 'fs'
import yaml from 'js-yaml'
import { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { CustomAgent } from '../../types/agent-chat'
import { createCategoryLogger } from '../../common/logger'
import { store } from '../../preload/store'
import { StrandsAgentsConverter } from '../services/strandsAgentsConverter'
import { createS3Client } from '../api/bedrock/client'

const agentsLogger = createCategoryLogger('agents:ipc')

/**
 * Load shared agents from the project directory
 * This function reads agent JSON and YAML files from the .bedrock-engineer/agents directory
 * Always reads from disk to ensure latest data is returned
 */
async function loadSharedAgents(): Promise<{ agents: CustomAgent[]; error: string | null }> {
  try {
    const projectPath = store.get('projectPath') as string
    if (!projectPath) {
      return { agents: [], error: null }
    }

    agentsLogger.debug('Loading shared agents from disk', { projectPath })
    const agentsDir = resolve(projectPath, '.bedrock-engineer/agents')

    // Check if the directory exists
    try {
      await fs.promises.access(agentsDir)
    } catch (error) {
      // If directory doesn't exist, just return empty array
      return { agents: [], error: null }
    }

    // Read JSON and YAML files in the agents directory
    const files = (await fs.promises.readdir(agentsDir)).filter(
      (file) => file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')
    )
    const agents: CustomAgent[] = []

    // Process all files concurrently using Promise.all for better performance
    const agentPromises = files.map(async (file) => {
      try {
        const filePath = resolve(agentsDir, file)
        const content = await fs.promises.readFile(filePath, 'utf-8')

        // Parse the file content based on its extension
        let agent: CustomAgent
        if (file.endsWith('.json')) {
          agent = JSON.parse(content) as CustomAgent
        } else if (file.endsWith('.yml') || file.endsWith('.yaml')) {
          agent = yaml.load(content) as CustomAgent
        } else {
          throw new Error(`Unsupported file format: ${file}`)
        }

        // Make sure each loaded agent has a unique ID to prevent React key conflicts
        // If the ID doesn't already start with 'shared-', prefix it
        if (!agent.id || !agent.id.startsWith('shared-')) {
          // Remove any file extension (.json, .yml, .yaml) for the safeName
          const safeName = file.replace(/\.(json|ya?ml)$/, '').toLowerCase()
          agent.id = `shared-${safeName}-${Math.random().toString(36).substring(2, 9)}`
        }

        // Add a flag to indicate this is a shared agent
        agent.isShared = true

        // mcpToolsは自動的に生成されるため、保存対象から除外（後でpreloadで復元される）
        // ここではmcpToolsを削除することでファイルからの読み込み時にも整合性を保つ
        delete agent.mcpTools

        return agent
      } catch (err) {
        agentsLogger.error(`Error reading agent file`, {
          file,
          error: err instanceof Error ? err.message : String(err)
        })
        return null
      }
    })

    // Wait for all promises to resolve and filter out any null results (from failed reads)
    const loadedAgents = (await Promise.all(agentPromises)).filter(
      (agent): agent is CustomAgent => agent !== null
    )
    agents.push(...loadedAgents)

    return { agents, error: null }
  } catch (error) {
    console.error('Error reading shared agents:', error)
    return { agents: [], error: error instanceof Error ? error.message : String(error) }
  }
}

export const agentHandlers = {
  'read-shared-agents': async (_event: IpcMainInvokeEvent) => {
    return await loadSharedAgents()
  },

  'save-shared-agent': async (
    _event: IpcMainInvokeEvent,
    agent: any,
    options?: { format?: 'json' | 'yaml' }
  ) => {
    try {
      const projectPath = store.get('projectPath') as string
      if (!projectPath) {
        return { success: false, error: 'No project path selected' }
      }

      // Determine file format (default to YAML if not specified)
      const format = options?.format || 'yaml'
      const fileExtension = format === 'json' ? '.json' : '.yaml'

      // Ensure directories exist
      const bedrockEngineerDir = resolve(projectPath, '.bedrock-engineer')
      const agentsDir = resolve(bedrockEngineerDir, 'agents')

      // Create directories if they don't exist (recursive will create both parent and child dirs)
      await fs.promises.mkdir(agentsDir, { recursive: true })

      // Generate a safe filename from the agent name
      const safeFileName =
        agent.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'custom-agent'

      // Check if the file already exists and add a suffix if needed
      let fileName = `${safeFileName}${fileExtension}`
      let count = 1

      // Helper function to check if file exists, using async fs
      const fileExists = async (path: string): Promise<boolean> => {
        try {
          await fs.promises.access(path)
          return true
        } catch {
          return false
        }
      }

      while (await fileExists(resolve(agentsDir, fileName))) {
        fileName = `${safeFileName}-${count}${fileExtension}`
        count++
      }

      // Generate new ID for shared agent to avoid key conflicts
      const newId = `shared-${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`

      // Make sure agent has isShared set to true and a unique ID
      const sharedAgent = {
        ...agent,
        id: newId,
        isShared: true
      }

      // mcpToolsは保存対象から除外（mcpServersのみを保存）
      delete sharedAgent.mcpTools

      // Write the agent to file based on the format
      const filePath = resolve(agentsDir, fileName)
      let fileContent: string

      if (format === 'json') {
        fileContent = JSON.stringify(sharedAgent, null, 2)
      } else {
        // For YAML format
        fileContent = yaml.dump(sharedAgent, {
          indent: 2,
          lineWidth: 120,
          noRefs: true, // Don't output YAML references
          sortKeys: false // Preserve key order
        })
      }

      await fs.promises.writeFile(filePath, fileContent, 'utf-8')

      return { success: true, filePath, format }
    } catch (error) {
      console.error('Error saving shared agent:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  'load-organization-agents': async (_event: IpcMainInvokeEvent, organizationConfig: any) => {
    try {
      agentsLogger.info('Loading organization agents from S3', {
        bucket: organizationConfig.s3Config.bucket,
        prefix: organizationConfig.s3Config.prefix,
        region: organizationConfig.s3Config.region
      })

      // AWS認証情報を取得し、組織設定のリージョンを適用
      const awsCredentials = store.get('aws') as any
      if (!awsCredentials) {
        return { agents: [], error: 'AWS credentials not configured' }
      }

      // AWS SDK を使用してS3からエージェントファイルを取得
      const s3Client = createS3Client({
        ...awsCredentials,
        region: organizationConfig.s3Config.region
      })

      // S3からオブジェクト一覧を取得
      const listCommand = new ListObjectsV2Command({
        Bucket: organizationConfig.s3Config.bucket,
        Prefix: organizationConfig.s3Config.prefix || ''
      })

      const listResponse = await s3Client.send(listCommand)
      const objects = listResponse.Contents || []

      // YAML/JSONファイルのみをフィルタリング
      const agentFiles = objects.filter(
        (obj: any) =>
          obj.Key &&
          (obj.Key.endsWith('.yaml') || obj.Key.endsWith('.yml') || obj.Key.endsWith('.json'))
      )

      const agents: CustomAgent[] = []

      // 各ファイルを並行して処理
      const agentPromises = agentFiles.map(async (file: any) => {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: organizationConfig.s3Config.bucket,
            Key: file.Key
          })

          const response = await s3Client.send(getCommand)
          const content = await response.Body?.transformToString('utf-8')

          if (!content) {
            agentsLogger.warn('Empty file content', { key: file.Key })
            return null
          }

          // ファイル形式に応じて解析
          let agent: CustomAgent
          if (file.Key.endsWith('.json')) {
            agent = JSON.parse(content) as CustomAgent
          } else {
            agent = yaml.load(content) as CustomAgent
          }

          // 組織エージェントとしてマーク
          const orgId = `org-${organizationConfig.id}-${file.Key.replace(/\.(json|ya?ml)$/, '').toLowerCase()}-${Math.random().toString(36).substring(2, 9)}`
          agent.id = orgId
          agent.isShared = false
          agent.isCustom = false
          agent.directoryOnly = false
          agent.organizationId = organizationConfig.id

          // mcpToolsは自動的に生成されるため削除
          delete agent.mcpTools

          return agent
        } catch (err) {
          agentsLogger.error('Error reading organization agent file', {
            key: file.Key,
            error: err instanceof Error ? err.message : String(err)
          })
          return null
        }
      })

      const loadedAgents = (await Promise.all(agentPromises)).filter(
        (agent): agent is CustomAgent => agent !== null
      )
      agents.push(...loadedAgents)

      return { agents, error: null }
    } catch (error) {
      agentsLogger.error('Error loading organization agents', {
        error: error instanceof Error ? error.message : String(error)
      })
      return { agents: [], error: error instanceof Error ? error.message : String(error) }
    }
  },

  'save-agent-to-organization': async (
    _event: IpcMainInvokeEvent,
    agent: any,
    organizationConfig: any,
    options?: { format?: 'json' | 'yaml' }
  ) => {
    try {
      agentsLogger.info('Saving agent to organization S3', {
        agentName: agent.name,
        bucket: organizationConfig.s3Config.bucket,
        prefix: organizationConfig.s3Config.prefix
      })

      // ファイル形式を決定（デフォルトはYAML）
      const format = options?.format || 'yaml'
      const fileExtension = format === 'json' ? '.json' : '.yaml'

      // 安全なファイル名を生成
      const safeFileName =
        agent.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || 'custom-agent'

      // S3キーを構築
      const prefix = organizationConfig.s3Config.prefix || ''
      const s3Key = prefix
        ? `${prefix}/${safeFileName}${fileExtension}`
        : `${safeFileName}${fileExtension}`

      // 組織共有エージェント用の新しいIDを生成
      const newId = `shared-${agent.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`

      // 保存用エージェント設定を準備
      const sharedAgent = {
        ...agent,
        id: newId,
        isShared: true,
        organizationId: organizationConfig.id
      }

      // mcpToolsは保存対象から除外
      delete sharedAgent.mcpTools

      // コンテンツを生成
      let fileContent: string
      if (format === 'json') {
        fileContent = JSON.stringify(sharedAgent, null, 2)
      } else {
        fileContent = yaml.dump(sharedAgent, {
          indent: 2,
          lineWidth: 120,
          noRefs: true,
          sortKeys: false
        })
      }

      // AWS認証情報を取得し、組織設定のリージョンを適用
      const awsCredentials = store.get('aws') as any
      if (!awsCredentials) {
        return { success: false, error: 'AWS credentials not configured' }
      }

      // AWS SDK を使用してS3にアップロード
      const s3Client = createS3Client({
        ...awsCredentials,
        region: organizationConfig.s3Config.region
      })

      const putCommand = new PutObjectCommand({
        Bucket: organizationConfig.s3Config.bucket,
        Key: s3Key,
        Body: fileContent,
        ContentType: format === 'json' ? 'application/json' : 'application/x-yaml'
      })

      await s3Client.send(putCommand)

      return { success: true, s3Key, format }
    } catch (error) {
      agentsLogger.error('Error saving agent to organization', {
        error: error instanceof Error ? error.message : String(error)
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  'convert-agent-to-strands': async (
    _event: IpcMainInvokeEvent,
    agentId: string,
    outputDirectory: string
  ) => {
    try {
      agentsLogger.info('Converting agent to Strands Agents', { agentId, outputDirectory })

      // First, try to find the agent in shared agents
      const { agents: sharedAgents } = await loadSharedAgents()
      let agent = sharedAgents.find((a) => a.id === agentId)

      // If not found in shared agents, try to get it from user settings
      if (!agent) {
        const userAgents = store.get('customAgents') || []
        agent = userAgents.find((a) => a.id === agentId)
      }

      if (!agent) {
        return {
          success: false,
          error: `Agent with ID ${agentId} not found`
        }
      }

      // Initialize converter and convert agent
      const converter = new StrandsAgentsConverter()
      const saveOptions = {
        outputDirectory,
        includeConfig: false,
        overwrite: true
      }

      const result = await converter.convertAndSaveAgent(agent, saveOptions)

      agentsLogger.info('Strands Agents conversion completed', {
        success: result.success,
        savedFiles: result.savedFiles.length
      })

      return result
    } catch (error) {
      agentsLogger.error('Error converting agent to Strands Agents', {
        agentId,
        error: error instanceof Error ? error.message : String(error)
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        outputDirectory,
        savedFiles: [],
        errors: [
          {
            file: 'conversion',
            error: error instanceof Error ? error.message : String(error)
          }
        ]
      }
    }
  }
} as const
