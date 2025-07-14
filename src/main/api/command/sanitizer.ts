export function sanitizeCommand(command: string): string {
  const parts = command.split(' ')
  const sanitizedParts = parts.map((part) => {
    return part.replace(/[^a-zA-Z0-9-\/]/g, '')
  })
  return sanitizedParts.join(' ')
}
