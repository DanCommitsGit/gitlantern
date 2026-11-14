import { app, shell } from 'electron'
import log from 'electron-log/node'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'

log.transports.file.resolvePathFn = () => join(app.getPath('logs'), 'main.log')

export function logError(context: string, error: unknown): void {
  log.error(context, error)
}

export function showLogFile(): void {
  const file = log.transports.file.getFile().path
  if (existsSync(file)) shell.showItemInFolder(file)
  else void shell.openPath(dirname(file))
}
