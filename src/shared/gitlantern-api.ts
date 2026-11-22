import type { CommandRecord } from './command-record'
import type { CommitLogPage, LogScope } from './history-types'
import type { Notice } from './notices'
import type { Branch, FileChange, FileDiff, RepositoryStatus } from './repository-types'
import type { SettingKey, Settings } from './settings'
import type { UpdateStatus } from './update-types'

export type GitCheck =
  | { state: 'ok'; version: string; path: string }
  | { state: 'missing' }
  | { state: 'too-old'; version: string }

export interface Identity {
  name: string | null
  email: string | null
}

export interface OpenedRepository {
  path: string
  name: string
  identity: Identity
  collapsedBranchGroups: string[]
}

export type RepositoryProgramSummary =
  { kind: 'setting'; name: string; value: string } | { kind: 'hook'; name: string }

export type OpenResult =
  | { kind: 'opened'; repository: OpenedRepository }
  | { kind: 'not-a-repository'; folder: string; message: string }
  | { kind: 'needs-trust'; path: string; programs: RepositoryProgramSummary[] }
  | { kind: 'failed'; message: string }

export interface RecentRepository {
  path: string
  name: string
}

export interface GitlanternApi {
  platform: string
  checkGit(): Promise<GitCheck>
  chooseGitLocation(): Promise<GitCheck>
  recentRepositories(): Promise<RecentRepository[]>
  chooseFolder(): Promise<string | null>
  openRepository(folder: string): Promise<OpenResult>
  trustPendingRepository(): Promise<OpenResult>
  createRepository(folder: string): Promise<{ result: OpenResult; record: CommandRecord | null }>
  closeRepository(): Promise<void>
  readStatus(): Promise<RepositoryStatus>
  readBranches(): Promise<Branch[]>
  saveCollapsedBranchGroups(groups: string[]): Promise<void>
  readDiff(change: FileChange, staged: boolean, showLarge: boolean): Promise<FileDiff>
  readCommitLog(scope: LogScope, search: string, skip: number): Promise<CommitLogPage>
  readCommitFiles(commitHash: string): Promise<FileChange[]>
  readCommitDiff(commitHash: string, change: FileChange, showLarge: boolean): Promise<FileDiff>
  stageFiles(paths: string[]): Promise<CommandRecord>
  stageAll(): Promise<CommandRecord>
  unstageFiles(paths: string[]): Promise<CommandRecord>
  unstageAll(): Promise<CommandRecord>
  commit(summary: string, description: string): Promise<CommandRecord>
  saveIdentity(
    name: string,
    email: string
  ): Promise<{ identity: Identity; records: CommandRecord[] }>
  copyText(text: string): Promise<void>
  readSettings(): Promise<Settings>
  saveSetting<Key extends SettingKey>(key: Key, value: Settings[Key]): Promise<Settings>
  showLogs(): Promise<void>
  readUpdateStatus(): Promise<UpdateStatus>
  checkForUpdates(): Promise<void>
  downloadUpdate(): Promise<void>
  installUpdate(): Promise<void>
  /** Returns a function that stops the listening. */
  onUpdateStatus(listener: (status: UpdateStatus) => void): () => void
  readNotices(): Promise<Notice[]>
  dismissNotice(notice: Notice): Promise<void>
  /** Returns a function that stops the listening. */
  onNotices(listener: (notices: Notice[]) => void): () => void
}

export const IPC_CHANNELS = {
  checkGit: 'git:check',
  chooseGitLocation: 'git:choose-location',
  recentRepositories: 'repository:recent',
  chooseFolder: 'repository:choose-folder',
  openRepository: 'repository:open',
  trustPendingRepository: 'repository:trust-pending',
  createRepository: 'repository:create',
  closeRepository: 'repository:close',
  readStatus: 'repository:status',
  readBranches: 'repository:branches',
  saveCollapsedBranchGroups: 'repository:save-collapsed-branch-groups',
  readDiff: 'repository:diff',
  readCommitLog: 'repository:commit-log',
  readCommitFiles: 'repository:commit-files',
  readCommitDiff: 'repository:commit-diff',
  stageFiles: 'repository:stage-files',
  stageAll: 'repository:stage-all',
  unstageFiles: 'repository:unstage-files',
  unstageAll: 'repository:unstage-all',
  commit: 'repository:commit',
  saveIdentity: 'git:save-identity',
  copyText: 'clipboard:copy-text',
  readSettings: 'settings:read',
  saveSetting: 'settings:save',
  showLogs: 'logs:show',
  readUpdateStatus: 'updates:status',
  checkForUpdates: 'updates:check',
  downloadUpdate: 'updates:download',
  installUpdate: 'updates:install',
  updateStatusChanged: 'updates:status-changed',
  readNotices: 'notices:read',
  dismissNotice: 'notices:dismiss',
  noticesChanged: 'notices:changed'
} as const
