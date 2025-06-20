import { IpcMainInvokeEvent, app } from 'electron'
import { spawn } from 'child_process'
import axios from 'axios'
import { log } from '../../common/logger'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { store } from '../../preload/store'
import type { ProxyConfiguration } from '../api/bedrock/types'

function createProxyAgent(proxyConfig?: ProxyConfiguration) {
  try {
    if (!proxyConfig?.enabled || !proxyConfig.host) {
      log.debug('Proxy agent not created: disabled or no host', {
        enabled: proxyConfig?.enabled,
        hasHost: !!proxyConfig?.host
      })
      return undefined
    }

    const proxyUrl = new URL(
      `${proxyConfig.protocol || 'http'}://${proxyConfig.host}:${proxyConfig.port || 8080}`
    )

    if (proxyConfig.username && proxyConfig.password) {
      proxyUrl.username = proxyConfig.username
      proxyUrl.password = proxyConfig.password
      log.debug('Proxy authentication configured')
    }

    // Create appropriate agent based on target URL protocol
    // For HTTPS targets, use HttpsProxyAgent; for HTTP targets, use HttpProxyAgent
    const httpsAgent = new HttpsProxyAgent(proxyUrl.href)

    log.debug('Proxy agents created successfully', {
      protocol: proxyConfig.protocol || 'http',
      host: '[REDACTED]',
      port: proxyConfig.port || 8080,
      hasAuth: !!(proxyConfig.username && proxyConfig.password)
    })

    // Return an object with both agents for flexible use
    return { httpsAgent }
  } catch (error) {
    log.error('Failed to create proxy agent', {
      error: error instanceof Error ? error.message : String(error),
      proxyEnabled: proxyConfig?.enabled,
      hasHost: !!proxyConfig?.host,
      protocol: proxyConfig?.protocol,
      port: proxyConfig?.port
    })
    return undefined
  }
}

export const utilHandlers = {
  'get-app-path': async (_event: IpcMainInvokeEvent) => {
    return app.getAppPath()
  },

  'fetch-website': async (_event: IpcMainInvokeEvent, params: [string, any?]) => {
    const [url, options] = params
    try {
      // Get proxy configuration from store
      const awsConfig = store.get('aws')

      log.debug('Proxy configuration check', {
        hasAwsConfig: !!awsConfig,
        hasProxyConfig: !!awsConfig?.proxyConfig,
        proxyEnabled: awsConfig?.proxyConfig?.enabled,
        proxyHost: awsConfig?.proxyConfig?.host ? '[REDACTED]' : undefined,
        proxyPort: awsConfig?.proxyConfig?.port,
        proxyProtocol: awsConfig?.proxyConfig?.protocol
      })

      const proxyAgents = createProxyAgent(awsConfig?.proxyConfig)

      log.debug('Proxy agent creation result', {
        hasProxyAgents: !!proxyAgents,
        url: url
      })

      const axiosConfig: any = {
        method: options?.method || 'GET',
        url: url,
        headers: {
          ...options?.headers,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }

      // Add request body if provided
      if (options?.body) {
        axiosConfig.data = options.body
      }

      // Apply appropriate proxy agent based on URL protocol
      if (proxyAgents) {
        const targetUrl = new URL(url)
        const agent = proxyAgents.httpsAgent

        if (targetUrl.protocol === 'https:') {
          axiosConfig.httpsAgent = agent
        } else {
          axiosConfig.httpAgent = agent
        }

        log.debug('Applied proxy agent to axios request', {
          url,
          targetProtocol: targetUrl.protocol,
          proxyProtocol: awsConfig?.proxyConfig?.protocol,
          agentType: targetUrl.protocol === 'https:' ? 'HttpsProxyAgent' : 'HttpProxyAgent',
          proxyHost: awsConfig?.proxyConfig?.host ? '[REDACTED]' : undefined,
          proxyPort: awsConfig?.proxyConfig?.port
        })
      } else {
        log.debug('No proxy agent configured, using direct connection', { url })
      }

      const response = await axios(axiosConfig)

      log.debug('Axios response received', {
        url,
        status: response.status,
        statusText: response.statusText,
        hasProxyAgents: !!proxyAgents,
        contentType: response.headers['content-type']
      })

      return {
        status: response.status,
        headers: response.headers as Record<string, string>,
        data: response.data
      }
    } catch (error) {
      log.error('Error fetching website', {
        url,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  },

  'check-docker-availability': async (_event: IpcMainInvokeEvent) => {
    return new Promise((resolve) => {
      const dockerProcess = spawn('docker', ['--version'], { stdio: 'pipe' })

      let output = ''
      let errorOutput = ''

      dockerProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      dockerProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString()
      })

      dockerProcess.on('close', (code) => {
        if (code === 0 && output.includes('Docker version')) {
          // Extract version information
          const versionMatch = output.match(/Docker version (\d+\.\d+\.\d+)/)
          const version = versionMatch ? versionMatch[1] : 'Unknown'

          resolve({
            available: true,
            version,
            lastChecked: new Date()
          })
        } else {
          resolve({
            available: false,
            error: errorOutput || 'Docker not found or not running',
            lastChecked: new Date()
          })
        }
      })

      dockerProcess.on('error', (error) => {
        resolve({
          available: false,
          error: error.message,
          lastChecked: new Date()
        })
      })

      // Timeout after 5 seconds
      setTimeout(() => {
        dockerProcess.kill()
        resolve({
          available: false,
          error: 'Docker check timed out',
          lastChecked: new Date()
        })
      }, 5000)
    })
  }
} as const
