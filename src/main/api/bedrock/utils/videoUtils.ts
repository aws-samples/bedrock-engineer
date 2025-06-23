import { promises as fs } from 'fs'
import path from 'path'
import type { VideoFormat, VideoMetadata, VideoValidationResult } from '../types/video'
import { VIDEO_CONSTRAINTS } from '../types/video'

/**
 * 動画ファイル処理に関するユーティリティ関数群
 */

/**
 * ファイル拡張子から動画形式を判定
 */
export function getVideoFormatFromExtension(filePath: string): VideoFormat {
  const ext = path.extname(filePath).toLowerCase().slice(1)

  switch (ext) {
    case 'mp4':
      return 'mp4'
    case 'mov':
      return 'mov'
    case 'mkv':
      return 'mkv'
    case 'webm':
      return 'webm'
    case 'flv':
      return 'flv'
    case 'mpeg':
      return 'mpeg'
    case 'mpg':
      return 'mpg'
    case 'wmv':
      return 'wmv'
    case '3gp':
      return 'three_gp'
    default:
      throw new Error(`Unsupported video format: ${ext}`)
  }
}

/**
 * 動画形式からMIMEタイプを取得
 */
export function getMimeTypeFromFormat(format: VideoFormat): string {
  return VIDEO_CONSTRAINTS.MIME_TYPES[format] || 'video/mp4'
}

/**
 * サポートされている動画形式かチェック
 */
export function isSupportedVideoFormat(filePath: string): boolean {
  try {
    const ext = path.extname(filePath).toLowerCase().slice(1)
    return VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.includes(ext as any)
  } catch {
    return false
  }
}

/**
 * 動画ファイルの基本検証
 */
export async function validateVideoFile(filePath: string): Promise<VideoValidationResult> {
  try {
    // ファイル存在確認
    const stats = await fs.stat(filePath)

    if (!stats.isFile()) {
      return {
        isValid: false,
        errorMessage: 'Specified path is not a file'
      }
    }

    // ファイルサイズ確認
    if (stats.size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: `File size (${Math.round(stats.size / 1024 / 1024)}MB) exceeds maximum limit (${VIDEO_CONSTRAINTS.MAX_FILE_SIZE / 1024 / 1024}MB)`
      }
    }

    // 空ファイルチェック
    if (stats.size === 0) {
      return {
        isValid: false,
        errorMessage: 'Video file is empty'
      }
    }

    // ファイル形式確認
    if (!isSupportedVideoFormat(filePath)) {
      const ext = path.extname(filePath).toLowerCase().slice(1)
      return {
        isValid: false,
        errorMessage: `Unsupported video format: ${ext}. Supported formats: ${VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`
      }
    }

    const format = getVideoFormatFromExtension(filePath)

    return {
      isValid: true,
      format,
      size: stats.size
    }
  } catch (error) {
    return {
      isValid: false,
      errorMessage: `Failed to validate video file: ${error}`
    }
  }
}

/**
 * 動画ファイルの基本メタデータを取得
 * より詳細な情報が必要な場合は、ffprobe等を使用することを推奨
 */
export async function getBasicVideoMetadata(filePath: string): Promise<VideoMetadata> {
  const stats = await fs.stat(filePath)
  const format = getVideoFormatFromExtension(filePath)

  const metadata: VideoMetadata = {
    format,
    size: stats.size
  }

  // TODO: より詳細なメタデータ取得の実装
  // ffprobe を使用して以下の情報を取得できる:
  // - duration: 動画の長さ（秒）
  // - width, height: 解像度
  // - fps: フレームレート
  //
  // 実装例:
  // const ffprobeResult = await execAsync(`ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`)
  // const info = JSON.parse(ffprobeResult.stdout)
  // metadata.duration = parseFloat(info.format.duration)
  // const videoStream = info.streams.find(s => s.codec_type === 'video')
  // if (videoStream) {
  //   metadata.width = videoStream.width
  //   metadata.height = videoStream.height
  //   metadata.fps = eval(videoStream.r_frame_rate) // "30/1" -> 30
  // }

  return metadata
}

/**
 * ファイルサイズをわかりやすい形式でフォーマット
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${Math.round(size * 100) / 100} ${units[unitIndex]}`
}

/**
 * 動画の長さを時:分:秒形式でフォーマット
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }
}

/**
 * S3 URIを分解
 */
export function parseS3Uri(s3Uri: string): { bucket: string; key: string } {
  const match = s3Uri.match(/^s3:\/\/([^/]+)\/(.+)$/)
  if (!match) {
    throw new Error(`Invalid S3 URI format: ${s3Uri}`)
  }

  return {
    bucket: match[1],
    key: match[2]
  }
}

/**
 * S3 URIを構築
 */
export function buildS3Uri(bucket: string, key: string): string {
  return `s3://${bucket}/${key}`
}

/**
 * 一意なS3キーを生成
 */
export function generateS3Key(fileName: string, prefix: string = 'temp-videos/'): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const cleanFileName = path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, '_')

  return `${prefix}${timestamp}-${randomSuffix}/${cleanFileName}`
}

/**
 * 動画ファイルの検証ルール定義
 */
export const VIDEO_VALIDATION_RULES = {
  /**
   * ファイルサイズの検証
   */
  fileSize: (size: number): { valid: boolean; message?: string } => {
    if (size > VIDEO_CONSTRAINTS.MAX_FILE_SIZE) {
      return {
        valid: false,
        message: `File size (${formatFileSize(size)}) exceeds maximum limit (${formatFileSize(VIDEO_CONSTRAINTS.MAX_FILE_SIZE)})`
      }
    }
    if (size === 0) {
      return {
        valid: false,
        message: 'Video file is empty'
      }
    }
    return { valid: true }
  },

  /**
   * ファイル形式の検証
   */
  format: (filePath: string): { valid: boolean; message?: string } => {
    if (!isSupportedVideoFormat(filePath)) {
      const ext = path.extname(filePath).toLowerCase().slice(1)
      return {
        valid: false,
        message: `Unsupported video format: ${ext}. Supported formats: ${VIDEO_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`
      }
    }
    return { valid: true }
  },

  /**
   * 動画時間の検証（推奨制限）
   */
  duration: (
    durationSeconds: number,
    isHighMotion: boolean = false
  ): { valid: boolean; message?: string; warning?: string } => {
    const limit = isHighMotion
      ? VIDEO_CONSTRAINTS.RECOMMENDED_DURATION.HIGH_MOTION
      : VIDEO_CONSTRAINTS.RECOMMENDED_DURATION.LOW_MOTION

    if (durationSeconds > limit) {
      const limitFormatted = formatDuration(limit)
      const durationFormatted = formatDuration(durationSeconds)
      const motionType = isHighMotion ? 'high-motion' : 'low-motion'

      return {
        valid: true, // 警告だが処理は続行可能
        warning: `Video duration (${durationFormatted}) exceeds recommended limit for ${motionType} content (${limitFormatted}). Processing may be less accurate.`
      }
    }

    return { valid: true }
  }
} as const
