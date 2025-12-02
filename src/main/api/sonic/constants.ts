// Nova 2 Sonic supported regions
export const NOVA_SONIC_SUPPORTED_REGIONS = [
  'us-east-1', // 米国東部 (バージニア北部)
  'us-west-2' // 米国西部 (オレゴン)
] as const

export type NovaSonicSupportedRegion = (typeof NOVA_SONIC_SUPPORTED_REGIONS)[number]

/**
 * Check if the given region supports Nova Sonic
 */
export function isNovaSonicSupportedRegion(region: string): region is NovaSonicSupportedRegion {
  return NOVA_SONIC_SUPPORTED_REGIONS.includes(region as NovaSonicSupportedRegion)
}

/**
 * Get the list of supported regions for Nova Sonic
 */
export function getNovaSonicSupportedRegions(): readonly string[] {
  return NOVA_SONIC_SUPPORTED_REGIONS
}
