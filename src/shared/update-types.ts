export type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'up-to-date' }
  | { kind: 'available'; version: string }
  | { kind: 'downloading'; version: string }
  | { kind: 'ready'; version: string }
  | { kind: 'failed' }

export interface UpdateStatus {
  currentVersion: string
  /** False where the app can only link to the download page. */
  canInstall: boolean
  /** False in development builds, where the updater is disabled. */
  canCheck: boolean
  state: UpdateState
}
