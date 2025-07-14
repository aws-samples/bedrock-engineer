import { createContext } from 'postman-sandbox'

export function executeInSandbox(
  command: string,
  callback: (error: Error | null, result: any) => void
) {
  createContext({}, (err, context) => {
    if (err) {
      return callback(err, null)
    }

    context.execute(command, callback)
  })
}
