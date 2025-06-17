// Nova Sonic supported regions as of 2024
export const NOVA_SONIC_SUPPORTED_REGIONS = [
  'us-east-1', // 米国東部 (バージニア北部)
  'us-west-2', // 米国西部 (オレゴン)
  'ap-northeast-1', // アジアパシフィック (東京)
  'eu-north-1' // 欧州 (ストックホルム)
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
