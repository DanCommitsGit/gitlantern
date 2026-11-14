import { app } from 'electron'
import log from 'electron-log/node'
import { join } from 'node:path'

log.transports.file.resolvePathFn = () => join(app.getPath('logs'), 'main.log')

export function logError(context: string, error: unknown): void {
  log.error(context, error)
}
