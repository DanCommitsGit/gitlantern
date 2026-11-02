import type { CommandRecord } from './command-record'
import type { FileChange, FileDiff, RepositoryStatus } from './repository-types'

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
  versions: { electron: string; chrome: string; node: string }
  ping(): void
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
  readDiff(change: FileChange, staged: boolean, showLarge: boolean): Promise<FileDiff>
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
  readDiff: 'repository:diff',
  stageFiles: 'repository:stage-files',
  stageAll: 'repository:stage-all',
  unstageFiles: 'repository:unstage-files',
  unstageAll: 'repository:unstage-all',
  commit: 'repository:commit',
  saveIdentity: 'git:save-identity',
  copyText: 'clipboard:copy-text'
} as const
