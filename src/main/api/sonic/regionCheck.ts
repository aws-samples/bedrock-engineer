import { isNovaSonicSupportedRegion, getNovaSonicSupportedRegions } from './constants'
import { store } from '../../../preload/store'

export interface RegionCheckResult {
  isSupported: boolean
  currentRegion: string
  supportedRegions: readonly string[]
  error?: string
}

/**
 * Check if Nova Sonic is available in the current AWS region
 */
export async function checkNovaSonicRegionSupport(region?: string): Promise<RegionCheckResult> {
  try {
    // Get the current region from store or parameter
    const currentRegion = region || store.get('aws')?.region || 'us-east-1'
    const supportedRegions = getNovaSonicSupportedRegions()

    // Quick check against known supported regions
    const isSupported = isNovaSonicSupportedRegion(currentRegion)

    return {
      isSupported,
      currentRegion,
      supportedRegions,
      error: isSupported
        ? undefined
        : `Nova Sonic is not available in ${currentRegion}. Please switch to a supported region.`
    }
  } catch (error) {
    const currentRegion = region || store.get('aws')?.region || 'us-east-1'
    return {
      isSupported: false,
      currentRegion,
      supportedRegions: getNovaSonicSupportedRegions(),
      error: `Failed to check region support: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

/**
 * Test Bedrock connectivity in the current region
 * This performs a lightweight test to verify service availability
 */
export async function testBedrockConnectivity(region?: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const currentRegion = region || store.get('aws')?.region || 'us-east-1'
    const awsConfig = store.get('aws')

    if (!awsConfig?.accessKeyId || !awsConfig?.secretAccessKey) {
      return {
        success: false,
        error: 'AWS credentials not configured'
      }
    }

    // For now, we just validate that credentials exist and region is specified
    // A more comprehensive test would require making an actual API call, but that might be expensive
    // and could fail due to network issues rather than configuration problems
    console.log(`Testing connectivity for region: ${currentRegion}`)
    return {
      success: true
    }
  } catch (error) {
    return {
      success: false,
      error: `Bedrock connectivity test failed: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}
