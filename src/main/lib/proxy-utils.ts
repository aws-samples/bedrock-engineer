import { ProxyConfiguration } from '../api/bedrock/types'
import { HttpsProxyAgent } from 'https-proxy-agent'
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
 * プロキシ設定をElectron Session用のProxyConfig形式に変換
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
