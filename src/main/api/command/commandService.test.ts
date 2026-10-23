import { CommandService } from './commandService'

describe('CommandService.executeCommand', () => {
  const createService = () =>
    new CommandService({
      shell: '/bin/bash',
      allowedCommands: [{ pattern: 'echo *', description: '' }]
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
    ['$', 'echo $(ls)'],
    ['$', 'echo $HOME'],
    ['$', 'echo ${HOME}'],
    ['>', 'echo a > /tmp/x'],
    ['<', 'cat < /etc/passwd']
  ]

  it.each(rejected)('rejects %s', async (_name, command) => {
    await expect(createService().executeCommand({ command, cwd })).rejects.toThrow('not allowed')
  })

  it('does not flag a plain command', () => {
    const service = createService() as any
    expect(service.containsShellControlSyntax('echo hello')).toBeNull()
    expect(service.isCommandAllowed('echo hello')).toBe(true)
  })

  it('rejects a command not on the allowlist', async () => {
    await expect(createService().executeCommand({ command: 'ls -la', cwd })).rejects.toThrow(
      'not allowed'
    )
  })
})
