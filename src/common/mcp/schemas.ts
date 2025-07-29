import { z } from 'zod'

/**
 * MCPサーバー設定のZodスキーマ
 * preloadとrendererの両方で使用される共通スキーマ
 */
export const mcpServerConfigSchema = z.object({
  mcpServers: z.record(
    z.string(),
    z.union([
      // コマンド形式のサーバー設定
      z.object({
        command: z.string(),
        args: z.array(z.string()),
        env: z.record(z.string(), z.string()).optional()
      }),
      // URL形式のサーバー設定
      z.object({
        url: z.string(),
        enabled: z.boolean().optional()
      })
    ])
  )
})

/**
 * Zodエラーをユーザーフレンドリーなメッセージに変換
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const path = issue.path.join('.')
    const message = issue.message
    return `${path}: ${message}`
  })

  if (issues.length === 1) {
    return `Validation error: ${issues[0]}`
  }

  return `Validation errors:\n${issues.map((issue) => `- ${issue}`).join('\n')}`
}

/**
 * MCPサーバー設定のバリデーション
 */
export function validateMcpServerConfig(data: unknown): {
  success: boolean
  data?: z.infer<typeof mcpServerConfigSchema>
  error?: string
} {
  const result = mcpServerConfigSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, error: formatZodError(result.error) }
}
