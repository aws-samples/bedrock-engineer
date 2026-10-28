import { matchesAllowedPattern, tokenizeCommand } from './commandTokenizer'

const tokens = (command: string, posixEscapes = true) => {
  const result = tokenizeCommand(command, { posixEscapes })
  if (!result.ok) throw new Error(result.error)
  return result.tokens
}

describe('tokenizeCommand', () => {
  it('splits on whitespace', () => {
    expect(tokens('git   status  -s')).toEqual(['git', 'status', '-s'])
  })

  it('keeps quoted arguments together and literal', () => {
    expect(tokens(`git commit -m "fix: a > b && c"`)).toEqual([
      'git',
      'commit',
      '-m',
      'fix: a > b && c'
    ])
    expect(tokens(`grep 'foo|bar' file.txt`)).toEqual(['grep', 'foo|bar', 'file.txt'])
    expect(tokens(`curl "https://example.com/x?a=1&b=2"`)).toEqual([
      'curl',
      'https://example.com/x?a=1&b=2'
    ])
  })

  it('does not expand variables or substitutions', () => {
    expect(tokens('echo $HOME')).toEqual(['echo', '$HOME'])
    expect(tokens(`echo "$(ls)"`)).toEqual(['echo', '$(ls)'])
  })

  it('handles empty quoted arguments and adjacent quotes', () => {
    expect(tokens(`node -e ""`)).toEqual(['node', '-e', ''])
    expect(tokens(`echo a"b c"'d'`)).toEqual(['echo', 'ab cd'])
  })

  it('handles POSIX backslash escapes', () => {
    expect(tokens('ls my\\ dir')).toEqual(['ls', 'my dir'])
    expect(tokens('echo "say \\"hi\\""')).toEqual(['echo', 'say "hi"'])
  })

  it('keeps backslashes as path separators on Windows', () => {
    expect(tokens('dir C:\\Users\\me', false)).toEqual(['dir', 'C:\\Users\\me'])
  })

  it.each([
    ['newline', 'echo a\nls'],
    ['newline in quotes', 'echo "a\nb"'],
    ['carriage return', 'echo a\rls'],
    [';', 'echo a; ls'],
    ['&&', 'echo a && ls'],
    ['background &', 'echo a &'],
    ['|', 'echo a | cat'],
    ['backtick', 'echo `ls`'],
    ['>', 'echo a > /tmp/x'],
    ['<', 'cat < /etc/passwd'],
    ['unterminated quote', 'echo "abc'],
    ['empty', '   ']
  ])('rejects %s', (_name, command) => {
    expect(tokenizeCommand(command, { posixEscapes: true }).ok).toBe(false)
  })
})

describe('matchesAllowedPattern', () => {
  it('requires the executable to match exactly', () => {
    expect(matchesAllowedPattern(['npm', '*'], ['npx', 'foo'])).toBe(false)
    expect(matchesAllowedPattern(['npm', '*'], ['npm'])).toBe(true)
    expect(matchesAllowedPattern(['npm', '*'], ['npm', 'run', 'build'])).toBe(true)
  })

  it('matches fixed arguments exactly', () => {
    expect(matchesAllowedPattern(['git', 'status'], ['git', 'status'])).toBe(true)
    expect(matchesAllowedPattern(['git', 'status'], ['git', 'status', '-s'])).toBe(false)
    expect(matchesAllowedPattern(['git', 'status'], ['git', 'push'])).toBe(false)
  })

  it('treats a trailing * as the rest of the arguments', () => {
    expect(matchesAllowedPattern(['npm', 'run', '*'], ['npm', 'run', 'build', '--watch'])).toBe(
      true
    )
    expect(matchesAllowedPattern(['npm', 'run', '*'], ['npm', 'install', 'x'])).toBe(false)
  })

  it('treats a * in the middle as exactly one argument', () => {
    expect(matchesAllowedPattern(['git', '*', 'status'], ['git', '-C', 'status'])).toBe(true)
    expect(matchesAllowedPattern(['git', '*', 'status'], ['git', 'status'])).toBe(false)
    expect(matchesAllowedPattern(['git', '*', 'status'], ['git', '-C', 'status', 'x'])).toBe(false)
  })
})
