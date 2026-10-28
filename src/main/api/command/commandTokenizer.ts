/**
 * executeCommand 用のコマンド文字列トークナイザ
 *
 * コマンドはシェルを介さずに spawn(file, args, { shell: false }) で実行するため、
 * シェルと同様のクォート解釈だけを行い、引数配列に分解する。
 * 変数展開・コマンド置換・グロブ展開は行わない（文字どおりの引数になる）。
 */

export type TokenizeResult = { ok: true; tokens: string[] } | { ok: false; error: string }

// クォート外に現れた場合に拒否するシェル制御文字（シェルを使わないため機能しない）
const UNQUOTED_CONTROL_CHARS = new Set([';', '&', '|', '<', '>', '`'])

/**
 * コマンド文字列を引数配列に分解する
 * - シングルクォート内は文字どおり
 * - ダブルクォート内では \" と \\ のみエスケープとして扱う（POSIX のみ）
 * - クォート外のバックスラッシュは次の1文字をエスケープする（POSIX のみ。Windows ではパス区切りとして扱う）
 * - 改行・CR はどこに現れても拒否する
 * - クォート外の ; & | < > ` は拒否する
 */
export const tokenizeCommand = (
  command: string,
  options: { posixEscapes?: boolean } = {}
): TokenizeResult => {
  const posixEscapes = options.posixEscapes ?? process.platform !== 'win32'

  if (/[\r\n]/.test(command)) {
    return { ok: false, error: 'newlines are not supported' }
  }

  const tokens: string[] = []
  let current = ''
  let inToken = false
  let quote: "'" | '"' | null = null

  for (let i = 0; i < command.length; i++) {
    const ch = command[i]

    if (quote === "'") {
      if (ch === "'") {
        quote = null
      } else {
        current += ch
      }
      continue
    }

    if (quote === '"') {
      if (ch === '"') {
        quote = null
      } else if (
        posixEscapes &&
        ch === '\\' &&
        (command[i + 1] === '"' || command[i + 1] === '\\')
      ) {
        current += command[++i]
      } else {
        current += ch
      }
      continue
    }

    if (ch === "'" || ch === '"') {
      quote = ch
      inToken = true
      continue
    }

    if (posixEscapes && ch === '\\') {
      if (i + 1 >= command.length) {
        return { ok: false, error: 'trailing backslash' }
      }
      current += command[++i]
      inToken = true
      continue
    }

    if (ch === ' ' || ch === '\t') {
      if (inToken) {
        tokens.push(current)
        current = ''
        inToken = false
      }
      continue
    }

    if (UNQUOTED_CONTROL_CHARS.has(ch)) {
      return { ok: false, error: `shell control syntax (${ch}) is not supported` }
    }

    current += ch
    inToken = true
  }

  if (quote) {
    return { ok: false, error: 'unterminated quote' }
  }
  if (inToken) {
    tokens.push(current)
  }
  if (tokens.length === 0) {
    return { ok: false, error: 'command is empty' }
  }

  return { ok: true, tokens }
}

/**
 * 許可パターン（例: "npm *", "git status"）とトークン化済みコマンドを照合する
 * - 先頭トークン（実行ファイル）は完全一致
 * - 末尾の * は 0 個以上の残りの引数すべてにマッチ
 * - 途中の * はちょうど 1 個の引数にマッチ
 * - それ以外の引数は完全一致
 */
export const matchesAllowedPattern = (
  patternTokens: string[],
  commandTokens: string[]
): boolean => {
  if (patternTokens.length === 0 || patternTokens[0] !== commandTokens[0]) {
    return false
  }

  const patternArgs = patternTokens.slice(1)
  const commandArgs = commandTokens.slice(1)
  const hasTrailingWildcard = patternArgs[patternArgs.length - 1] === '*'
  const fixedArgs = hasTrailingWildcard ? patternArgs.slice(0, -1) : patternArgs

  if (
    hasTrailingWildcard
      ? commandArgs.length < fixedArgs.length
      : commandArgs.length !== fixedArgs.length
  ) {
    return false
  }

  return fixedArgs.every((arg, index) => arg === '*' || arg === commandArgs[index])
}
