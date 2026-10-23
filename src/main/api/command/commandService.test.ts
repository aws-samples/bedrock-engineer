import { CommandService } from './commandService'

const isWindows = process.platform === 'win32'

describe('CommandService.executeCommand', () => {
  const createService = () =>
    new CommandService({
      shell: '/bin/bash',
      allowedCommands: [
        { pattern: 'echo *', description: '' },
        { pattern: 'bedrock-engineer-missing-command *', description: '' }
      ]
    })
  const cwd = process.cwd()

  const rejected: [string, string][] = [
    ['newline', 'echo a\nrm -rf x'],
    ['carriage return', 'echo a\rb'],
    [';', 'echo a; ls'],
    ['&', 'echo a && ls'],
    ['background &', 'echo a &'],
    ['|', 'echo a | cat'],
    ['backtick', 'echo `ls`'],
    ['>', 'echo a > /tmp/x'],
    ['<', 'cat < /etc/passwd'],
    ['unterminated quote', 'echo "a']
  ]

  it.each(rejected)('rejects %s', async (_name, command) => {
    await expect(createService().executeCommand({ command, cwd })).rejects.toThrow('not allowed')
  })

  it('rejects a command not on the allowlist', async () => {
    await expect(createService().executeCommand({ command: 'ls -la', cwd })).rejects.toThrow(
      'not allowed'
    )
  })

  it('checks the allowlist against the tokenized command', () => {
    const service = createService() as any
    expect(service.isCommandAllowed(['echo', 'hello'])).toBe(true)
    expect(service.isCommandAllowed(['ls', 'echo'])).toBe(false)
  })

  // Unix では /bin/echo を直接起動し、シェルを介さないことを確認する
  ;(isWindows ? it.skip : it)('runs without a shell and passes arguments literally', async () => {
    const result = await createService().executeCommand({
      command: `echo "a;b" '$HOME' "x|y"`,
      cwd
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe('a;b $HOME x|y')
  })

  it('rejects when the executable does not exist', async () => {
    await expect(
      createService().executeCommand({ command: 'bedrock-engineer-missing-command', cwd })
    ).rejects.toThrow(/Failed to start process|Command execution failed/)
  })
})
