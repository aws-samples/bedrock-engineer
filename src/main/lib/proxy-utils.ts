import { ProxyConfiguration, AWSCredentials } from '../api/bedrock/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { log } from '../../common/logger'
import fetch from 'node-fetch'

/**
 * プロキシURLを解析してProxyConfiguration形式に変換
 * @param proxyUrl プロキシURL（例: http://user:pass@proxy.example.com:8080）
 * @returns ProxyConfiguration | null
 */
export function parseProxyUrl(proxyUrl: string): ProxyConfiguration | null {
  try {
    const url = new URL(proxyUrl)

    return {
      enabled: true,
      host: url.hostname,
      port: parseInt(url.port) || (url.protocol === 'https:' ? 443 : 8080),
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      username: url.username || undefined,
      password: url.password || undefined
    }
  } catch (error) {
    log.error('Failed to parse proxy URL', {
      proxyUrl,
      error: error instanceof Error ? error.message : String(error)
    })
    return null
  }
}

/**
 * プロキシ接続をテストする
 * @param proxyConfig プロキシ設定
 * @param testUrl テスト対象URL（デフォルト: https://httpbin.org/ip）
 * @returns Promise<boolean> 接続成功の場合true
 */
export async function testProxyConnection(
  proxyConfig: ProxyConfiguration,
  testUrl: string = 'https://httpbin.org/ip'
): Promise<boolean> {
  if (!proxyConfig.enabled || !proxyConfig.host) {
    return false
  }

  try {
    const proxyUrl = new URL(
      `${proxyConfig.protocol || 'http'}://${proxyConfig.host}:${proxyConfig.port || 8080}`
    )

    if (proxyConfig.username && proxyConfig.password) {
      proxyUrl.username = proxyConfig.username
      proxyUrl.password = proxyConfig.password
    }

    const agent = new HttpsProxyAgent(proxyUrl.href)

    const response = await fetch(testUrl, {
      agent,
      method: 'GET'
    } as any)

    const success = response.ok
    log.info('Proxy connection test result', {
      proxyHost: proxyConfig.host,
      proxyPort: proxyConfig.port,
      testUrl,
      success,
      status: response.status
    })

    return success
  } catch (error) {
    log.error('Proxy connection test failed', {
      proxyHost: proxyConfig.host,
      proxyPort: proxyConfig.port,
      testUrl,
      error: error instanceof Error ? error.message : String(error)
    })
    return false
  }
}

/**
 * プロキシ認証情報の妥当性をチェック
 * @param proxyConfig プロキシ設定
 * @returns 検証結果
 */
export function validateProxyAuth(proxyConfig: ProxyConfiguration): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  if (proxyConfig.enabled && proxyConfig.host) {
    if (
      (proxyConfig.username && !proxyConfig.password) ||
      (!proxyConfig.username && proxyConfig.password)
    ) {
      warnings.push('Username and password must both be provided for proxy authentication')
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings
  }
}

/**
 * プロキシ設定をElectron Session用のProxyConfig形式に変換
 *
 * 注意: ElectronのproxyRulesは認証情報を含めません。
 * プロキシ認証はapp.on('login')イベントで別途処理されます。
 *
 * @param proxyConfig プロキシ設定
 * @returns Electron Session用のproxy設定文字列
 */
export function convertToElectronProxyConfig(proxyConfig: ProxyConfiguration): string | null {
  if (!proxyConfig.enabled || !proxyConfig.host) {
    return null
  }

  const port = proxyConfig.port || 8080

  // Electron Session用のproxyRules形式
  // 例: "http=proxy.example.com:8080;https=proxy.example.com:8080"
  // 認証情報はここには含まれず、app.on('login')で処理される
  return `http=${proxyConfig.host}:${port};https=${proxyConfig.host}:${port}`
}

/**
 * プロキシ設定を決定する（手動設定のみ使用）
 * @param manualConfig 手動設定のプロキシ
 * @returns 最終的に使用するプロキシ設定
 */
export function resolveProxyConfig(manualConfig?: ProxyConfiguration): ProxyConfiguration | null {
  // 手動設定が有効な場合のみプロキシを使用
  if (manualConfig?.enabled && manualConfig.host) {
    log.debug('Using manual proxy configuration', {
      host: manualConfig.host,
      port: manualConfig.port
    })
    return manualConfig
  }

  // プロキシなし
  log.debug('No proxy configuration found')
  return null
}

/**
 * プロキシエージェント作成のオプション
 */
export interface ProxyAgentOptions {
  includeHttpAgent?: boolean
  includeHttpsAgent?: boolean
  includeNodeHandler?: boolean
}

/**
 * プロキシエージェント作成の結果
 */
export interface ProxyAgentResult {
  httpAgent?: HttpsProxyAgent<string>
  httpsAgent?: HttpsProxyAgent<string>
  requestHandler?: NodeHttpHandler
}

/**
 * プロキシエージェントを作成する共通関数
 * @param config プロキシ設定またはAWS認証情報
 * @param options 作成するエージェントのオプション
 * @returns プロキシエージェントまたはnull
 */
export function createProxyAgents(
  config: ProxyConfiguration | AWSCredentials,
  options: ProxyAgentOptions = { includeHttpsAgent: true }
): ProxyAgentResult | null {
  try {
    // ProxyConfigurationまたはAWSCredentialsからプロキシ設定を取得
    let proxyConfig: ProxyConfiguration | null = null

    if ('proxyConfig' in config) {
      // AWSCredentials の場合
      proxyConfig = resolveProxyConfig(config.proxyConfig)
    } else {
      // ProxyConfiguration の場合
      const proxyConf = config as ProxyConfiguration
      proxyConfig = proxyConf.enabled && proxyConf.host ? proxyConf : null
    }

    if (!proxyConfig?.enabled || !proxyConfig.host) {
      log.debug('Proxy agent not created: disabled or no host', {
        enabled: proxyConfig?.enabled,
        hasHost: !!proxyConfig?.host
      })
      return null
    }

    const proxyUrl = new URL(
      `${proxyConfig.protocol || 'http'}://${proxyConfig.host}:${proxyConfig.port || 8080}`
    )

    if (proxyConfig.username && proxyConfig.password) {
      proxyUrl.username = proxyConfig.username
      proxyUrl.password = proxyConfig.password
    }

    const result: ProxyAgentResult = {}

    // HttpsProxyAgent を作成（HTTP/HTTPS両方に使用可能）
    const agent = new HttpsProxyAgent(proxyUrl.href)

    if (options.includeHttpAgent) {
      result.httpAgent = agent
    }

    if (options.includeHttpsAgent !== false) {
      result.httpsAgent = agent
    }

    if (options.includeNodeHandler) {
      result.requestHandler = new NodeHttpHandler({
        httpAgent: agent,
        httpsAgent: agent,
        requestTimeout: 300000, // 5 minutes
        connectionTimeout: 30000 // 30 seconds
      })
    }

    log.debug('Proxy agents created successfully', {
      protocol: proxyConfig.protocol || 'http',
      host: '[REDACTED]',
      port: proxyConfig.port || 8080,
      hasAuth: !!(proxyConfig.username && proxyConfig.password),
      includeHttpAgent: options.includeHttpAgent,
      includeHttpsAgent: options.includeHttpsAgent,
      includeNodeHandler: options.includeNodeHandler
    })

    return result
  } catch (error) {
    log.error('Failed to create proxy agents', {
      error: error instanceof Error ? error.message : String(error),
      options
    })
    return null
  }
}

/**
 * AWS Bedrock用のHTTPオプションを作成する便利関数
 * @param awsCredentials AWS認証情報
 * @returns HTTPオプション
 */
export function createHttpOptions(awsCredentials: AWSCredentials): object {
  const proxyAgents = createProxyAgents(awsCredentials, { includeNodeHandler: true })

  if (!proxyAgents?.requestHandler) {
    return {}
  }

  return {
    requestHandler: proxyAgents.requestHandler
  }
}

/**
 * Nova Sonic用のHTTPオプションを作成する便利関数
 * @param proxyConfig プロキシ設定
 * @returns HTTPオプション
 */
export function createSonicHttpOptions(proxyConfig?: ProxyConfiguration): object {
  if (!proxyConfig) {
    return {}
  }

  const proxyAgents = createProxyAgents(proxyConfig, {
    includeHttpAgent: true,
    includeHttpsAgent: true
  })

  if (!proxyAgents) {
    return {}
  }

  return {
    httpAgent: proxyAgents.httpAgent,
    httpsAgent: proxyAgents.httpsAgent
  }
}

/**
 * Util handlers用のプロキシエージェントを作成する便利関数
 * @param proxyConfig プロキシ設定
 * @returns プロキシエージェント
 */
export function createUtilProxyAgent(proxyConfig?: ProxyConfiguration): {
  httpsAgent?: HttpsProxyAgent<string>
} {
  if (!proxyConfig) {
    return {}
  }

  const proxyAgents = createProxyAgents(proxyConfig, { includeHttpsAgent: true })

  if (!proxyAgents?.httpsAgent) {
    return {}
  }

  return {
    httpsAgent: proxyAgents.httpsAgent
  }
}
