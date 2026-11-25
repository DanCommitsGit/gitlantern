import type { CommandRecord } from './command-record'
import type { PullMode } from './git-actions'
import type { CommitLogPage, LogScope } from './history-types'
import type { Notification, Severity } from './notifications'
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

export type CloneResult =
    { kind: 'cloned'; result: OpenResult; record: CommandRecord } | { kind: 'failed'; message: string }

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
    /** Null when the app should start on the welcome screen. */
    openStartupRepository(): Promise<OpenResult | null>
    trustPendingRepository(): Promise<OpenResult>
    createRepository(folder: string): Promise<{ result: OpenResult; record: CommandRecord | null }>
    /** Clones into a new folder named after the URL inside `parentFolder`, and opens it. */
    cloneRepository(url: string, parentFolder: string): Promise<CloneResult>
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
    fetch(): Promise<CommandRecord>
    pull(mode: PullMode): Promise<CommandRecord>
    /** Pushes the current branch, setting its upstream when it has none. */
    push(): Promise<CommandRecord>
    saveIdentity(name: string, email: string): Promise<{ identity: Identity; records: CommandRecord[] }>
    copyText(text: string): Promise<void>
    /** Tints the window controls like the dialog scrim when `open` is true, and restores them when false. */
    setDialogOpen(open: boolean): Promise<void>
    readSettings(): Promise<Settings>
    saveSetting<Key extends SettingKey>(key: Key, value: Settings[Key]): Promise<Settings>
    showLogs(): Promise<void>
    readUpdateStatus(): Promise<UpdateStatus>
    checkForUpdates(): Promise<void>
    downloadUpdate(): Promise<void>
    installUpdate(): Promise<void>
    /** Returns a function that stops the listening. */
    onUpdateStatus(listener: (status: UpdateStatus) => void): () => void
    /** Oldest first. */
    readNotifications(): Promise<Notification[]>
    raiseNotification(severity: Severity, message: string, source?: string): Promise<void>
    resolveNotifications(source: string): Promise<void>
    dismissNotification(id: number): Promise<void>
    /** Hides the banner and keeps the notification in the list. */
    dismissNotificationBanner(id: number): Promise<void>
    dismissAllNotifications(): Promise<void>
    /** Returns a function that stops the listening. */
    onNotifications(listener: (notifications: Notification[]) => void): () => void
}

export const IPC_CHANNELS = {
    checkGit: 'git:check',
    chooseGitLocation: 'git:choose-location',
    recentRepositories: 'repository:recent',
    chooseFolder: 'repository:choose-folder',
    openRepository: 'repository:open',
    openStartupRepository: 'repository:open-startup',
    trustPendingRepository: 'repository:trust-pending',
    createRepository: 'repository:create',
    cloneRepository: 'repository:clone',
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
    fetch: 'repository:fetch',
    pull: 'repository:pull',
    push: 'repository:push',
    saveIdentity: 'git:save-identity',
    copyText: 'clipboard:copy-text',
    setDialogOpen: 'window:set-dialog-open',
    readSettings: 'settings:read',
    saveSetting: 'settings:save',
    showLogs: 'logs:show',
    readUpdateStatus: 'updates:status',
    checkForUpdates: 'updates:check',
    downloadUpdate: 'updates:download',
    installUpdate: 'updates:install',
    updateStatusChanged: 'updates:status-changed',
    readNotifications: 'notifications:read',
    raiseNotification: 'notifications:raise',
    resolveNotifications: 'notifications:resolve',
    dismissNotification: 'notifications:dismiss',
    dismissNotificationBanner: 'notifications:dismiss-banner',
    dismissAllNotifications: 'notifications:dismiss-all',
    notificationsChanged: 'notifications:changed'
} as const
