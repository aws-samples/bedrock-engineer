const API_ENDPOINT = window.store.get('apiEndpoint')

export interface RegionCheckResult {
  isSupported: boolean
  currentRegion: string
  supportedRegions: readonly string[]
  error?: string
}

export interface ConnectivityTestResult {
  success: boolean
  error?: string
}

/**
 * Check if Nova Sonic is supported in the current or specified region
 */
export async function checkNovaSonicRegionSupport(region?: string): Promise<RegionCheckResult> {
  try {
    const url = new URL('/nova-sonic/region-check', API_ENDPOINT)
    if (region) {
      url.searchParams.set('region', region)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to check Nova Sonic region support:', error)
    return {
      isSupported: false,
      currentRegion: region || 'unknown',
      supportedRegions: ['us-east-1', 'us-west-2'],
      error: `Failed to check region support: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Test Bedrock connectivity in the current or specified region
 */
export async function testBedrockConnectivity(region?: string): Promise<ConnectivityTestResult> {
  try {
    const url = new URL('/bedrock/connectivity-test', API_ENDPOINT)
    if (region) {
      url.searchParams.set('region', region)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
      throw new Error(errorData.error?.message || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to test Bedrock connectivity:', error)
    return {
      success: false,
      error: `Connectivity test failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
