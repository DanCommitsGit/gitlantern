import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { basename, isAbsolute, normalize, sep } from 'node:path'
import { cloneDestination } from '../shared/clone-destination'
import {
    cloneAction,
    commitAction,
    fetchAction,
    initAction,
    pullAction,
    pushAction,
    saveIdentityActions,
    stageAllAction,
    stageFilesAction,
    unstageAllAction,
    unstageFilesAction,
    type PullMode
} from '../shared/git-actions'
import { publishTargetOf } from '../shared/publish-target'
import type { CommandRecord } from '../shared/command-record'
import type { CloneResult, GitCheck, Identity, OpenResult } from '../shared/gitlantern-api'
import type { CommitLogPage, LogScope } from '../shared/history-types'
import type { Branch, FileChange, FileDiff, RepositoryStatus } from '../shared/repository-types'
import { readBranches } from './git/branches'
import { readCommitFiles } from './git/commit-files'
import { readCommitLog } from './git/commit-log'
import { readCommitFileDiff, readFileDiff } from './git/file-diff'
import { findGitPath } from './git/find-git'
import { isSupportedGitVersion } from './git/git-version'
import { findRepositoryPrograms, type RepositoryProgram } from './git/repository-trust'
import { readRepositoryStatus } from './git/repository-status'
import { runAction } from './git/run-action'
import { runGit } from './git/run-git'

const MAX_RECENT_REPOSITORIES = 10

export interface AppData {
    recentRepositories: string[]
    // Repository path to a fingerprint of the programs the user trusted.
    trustedPrograms: Record<string, string>
    gitLocation: string | null
    // The repository that was open when the app last quit, or null when none was.
    lastOpenRepository: string | null
    // Repository path to the branch groups collapsed in the repository sidebar.
    collapsedBranchGroups: Record<string, string[]>
}

export interface AppDataStore {
    get<Key extends keyof AppData>(key: Key): AppData[Key]
    set<Key extends keyof AppData>(key: Key, value: AppData[Key]): void
}

function fingerprint(programs: RepositoryProgram[]): string {
    return createHash('sha256').update(JSON.stringify(programs)).digest('hex')
}

export class RepositorySession {
    private gitPath: string | null = null
    private repositoryPath: string | null = null
    private pendingTrust: { path: string; programs: RepositoryProgram[] } | null = null
    // finished resolves after git stops and any removal of the clone's folder has been tried.
    private runningClone: { abortController: AbortController; finished: Promise<void> } | null = null

    constructor(private readonly store: AppDataStore) {}

    async checkGit(): Promise<GitCheck> {
        this.gitPath = null
        const gitPath = this.store.get('gitLocation') ?? findGitPath()
        return gitPath === null ? { state: 'missing' } : this.checkGitAt(gitPath)
    }

    async useGitLocation(gitPath: string): Promise<GitCheck> {
        const check = await this.checkGitAt(gitPath)
        if (check.state === 'ok') this.store.set('gitLocation', gitPath)
        return check
    }

    private async checkGitAt(gitPath: string): Promise<GitCheck> {
        try {
            const result = await runGit({ gitPath, gitArguments: ['--version'] })
            const versionOutput = result.stdout.toString().trim()
            const version = versionOutput.replace(/^git version /, '')
            if (!isSupportedGitVersion(versionOutput)) return { state: 'too-old', version }

            this.gitPath = gitPath
            return { state: 'ok', version, path: gitPath }
        } catch {
            return { state: 'missing' }
        }
    }

    recentRepositories(): string[] {
        return this.store.get('recentRepositories')
    }

    async open(folder: string): Promise<OpenResult> {
        const gitPath = this.requireGitPath()
        this.close()

        // Git's messages are translated, and this one is matched below.
        const topLevelResult = await runGit({
            gitPath,
            repositoryPath: folder,
            gitArguments: ['rev-parse', '--show-toplevel'],
            environment: { ...process.env, LC_ALL: 'C' }
        })
        if (topLevelResult.exitCode !== 0) {
            const message = topLevelResult.stderr.toString().trim()
            return message.includes('not a git repository')
                ? { kind: 'not-a-repository', folder, message }
                : { kind: 'failed', message }
        }

        const repositoryPath = normalize(topLevelResult.stdout.toString().trim())
        const programs = await findRepositoryPrograms({ gitPath, repositoryPath })
        const isTrusted =
            programs.length === 0 ||
            this.store.get('trustedPrograms')[repositoryPath] === fingerprint(programs)
        if (!isTrusted) {
            this.pendingTrust = { path: repositoryPath, programs }
            return { kind: 'needs-trust', path: repositoryPath, programs }
        }

        return this.finishOpening(repositoryPath)
    }

    /** Opens the repository that was open when the app last quit, or returns null when none was. */
    async openLastRepository(): Promise<OpenResult | null> {
        const lastOpenRepository = this.store.get('lastOpenRepository')
        return lastOpenRepository === null ? null : this.open(lastOpenRepository)
    }

    async trustPending(): Promise<OpenResult> {
        if (this.pendingTrust === null) throw new Error('No repository is waiting to be trusted')

        const { path, programs } = this.pendingTrust
        this.pendingTrust = null
        this.store.set('trustedPrograms', {
            ...this.store.get('trustedPrograms'),
            [path]: fingerprint(programs)
        })
        return this.finishOpening(path)
    }

    async create(folder: string): Promise<{ result: OpenResult; record: CommandRecord | null }> {
        const result = await this.open(folder)
        if (result.kind !== 'not-a-repository') return { result, record: null }

        const record = await runAction(
            { gitPath: this.requireGitPath(), repositoryPath: folder },
            initAction()
        )
        return record.exitCode === 0
            ? { result: await this.open(folder), record }
            : { result: { kind: 'failed', message: record.output }, record }
    }

    async clone(url: string, parentFolder: string, onProgress: (line: string) => void): Promise<CloneResult> {
        const gitPath = this.requireGitPath()
        if (!isAbsolute(parentFolder)) throw new Error('Expected a full folder path')
        const destination = cloneDestination(url, parentFolder, sep)
        if (destination === null) throw new Error('The URL has no repository name')
        if (this.runningClone !== null) throw new Error('A clone is already running')

        // Only a folder this clone created is removed when it fails or is cancelled.
        const existedBefore = existsSync(destination)
        const abortController = new AbortController()
        const { promise: finished, resolve: markFinished } = Promise.withResolvers<void>()
        this.runningClone = { abortController, finished }

        let record: CommandRecord | null = null
        let notRemovedMessage: string | null = null
        try {
            record = await runAction({ gitPath }, cloneAction(url, destination), {
                signal: abortController.signal,
                onProgress,
                // A large repository can take longer than any fixed limit, and the user can cancel.
                timeoutMilliseconds: 0
            })
        } catch (error) {
            if (!abortController.signal.aborted) throw error
        } finally {
            if (record?.exitCode !== 0 && !existedBefore) {
                try {
                    await rm(destination, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 })
                } catch {
                    notRemovedMessage = `The folder couldn't be removed: ${destination}`
                }
            }
            this.runningClone = null
            markFinished()
        }

        if (record === null) {
            return notRemovedMessage === null
                ? { kind: 'cancelled' }
                : { kind: 'failed', message: notRemovedMessage }
        }
        if (record.exitCode !== 0) {
            const message = [record.output, notRemovedMessage].filter((part) => part !== null).join('\n\n')
            return { kind: 'failed', message }
        }
        // The command ran, so it is returned for the history even when the new repository can't be opened.
        const result = await this.open(destination).catch((error: unknown): OpenResult => ({
            kind: 'failed',
            message: error instanceof Error ? error.message : String(error)
        }))
        return { kind: 'cloned', result, record }
    }

    cancelClone(): void {
        this.runningClone?.abortController.abort()
    }

    /** Cancels the running clone and resolves once its cleanup is over. Returns null when no clone is running. */
    stopClone(): Promise<void> | null {
        if (this.runningClone === null) return null

        const { finished } = this.runningClone
        this.cancelClone()
        return finished
    }

    close(): void {
        this.repositoryPath = null
        this.pendingTrust = null
        this.store.set('lastOpenRepository', null)
    }

    async readStatus(): Promise<RepositoryStatus> {
        return readRepositoryStatus(this.requireRepository())
    }

    async readBranches(): Promise<Branch[]> {
        return readBranches(this.requireRepository())
    }

    saveCollapsedBranchGroups(groups: string[]): void {
        const { repositoryPath } = this.requireRepository()
        const collapsedBranchGroups = { ...this.store.get('collapsedBranchGroups') }
        if (groups.length === 0) delete collapsedBranchGroups[repositoryPath]
        else collapsedBranchGroups[repositoryPath] = groups
        this.store.set('collapsedBranchGroups', collapsedBranchGroups)
    }

    async readDiff(change: FileChange, staged: boolean, showLarge: boolean): Promise<FileDiff> {
        return readFileDiff(this.requireRepository(), change, staged, showLarge)
    }

    async readCommitLog(scope: LogScope, search: string, skip: number): Promise<CommitLogPage> {
        return readCommitLog(this.requireRepository(), scope, search, skip)
    }

    async readCommitFiles(commitHash: string): Promise<FileChange[]> {
        return readCommitFiles(this.requireRepository(), commitHash)
    }

    async readCommitDiff(commitHash: string, change: FileChange, showLarge: boolean): Promise<FileDiff> {
        return readCommitFileDiff(this.requireRepository(), commitHash, change, showLarge)
    }

    async stageFiles(paths: string[]): Promise<CommandRecord> {
        return runAction(this.requireRepository(), stageFilesAction(paths))
    }

    async stageAll(): Promise<CommandRecord> {
        return runAction(this.requireRepository(), stageAllAction())
    }

    async unstageFiles(paths: string[]): Promise<CommandRecord> {
        const { hasCommits } = await this.readStatus()
        return runAction(this.requireRepository(), unstageFilesAction(paths, hasCommits))
    }

    async unstageAll(): Promise<CommandRecord> {
        const { hasCommits } = await this.readStatus()
        return runAction(this.requireRepository(), unstageAllAction(hasCommits))
    }

    async commit(summary: string, description: string): Promise<CommandRecord> {
        return runAction(this.requireRepository(), commitAction(summary, description))
    }

    async fetch(): Promise<CommandRecord> {
        return runAction(this.requireRepository(), fetchAction())
    }

    async pull(mode: PullMode): Promise<CommandRecord> {
        return runAction(this.requireRepository(), pullAction(mode))
    }

    // Pushes with -u to publishTargetOf's remote when the branch has no upstream; otherwise a plain push.
    async push(): Promise<CommandRecord> {
        const publishTarget = publishTargetOf(await this.readStatus())
        return runAction(this.requireRepository(), pushAction(publishTarget))
    }

    async saveIdentity(
        name: string,
        email: string
    ): Promise<{ identity: Identity; records: CommandRecord[] }> {
        const repository = this.requireRepository()
        const records: CommandRecord[] = []
        for (const action of saveIdentityActions(name, email)) {
            records.push(await runAction(repository, action))
        }
        return { identity: await this.readIdentity(repository), records }
    }

    private async finishOpening(repositoryPath: string): Promise<OpenResult> {
        this.repositoryPath = repositoryPath
        this.store.set('lastOpenRepository', repositoryPath)
        const recentPaths = this.store.get('recentRepositories').filter((path) => path !== repositoryPath)
        this.store.set(
            'recentRepositories',
            [repositoryPath, ...recentPaths].slice(0, MAX_RECENT_REPOSITORIES)
        )

        return {
            kind: 'opened',
            repository: {
                path: repositoryPath,
                name: basename(repositoryPath),
                identity: await this.readIdentity(this.requireRepository()),
                collapsedBranchGroups: this.store.get('collapsedBranchGroups')[repositoryPath] ?? []
            }
        }
    }

    private async readIdentity(repository: { gitPath: string; repositoryPath: string }): Promise<Identity> {
        const readSetting = async (settingName: string): Promise<string | null> => {
            const result = await runGit({ ...repository, gitArguments: ['config', settingName] })
            return result.exitCode === 0 ? result.stdout.toString().trim() : null
        }
        return { name: await readSetting('user.name'), email: await readSetting('user.email') }
    }

    private requireGitPath(): string {
        if (this.gitPath === null) throw new Error('Git has not been found')
        return this.gitPath
    }

    private requireRepository(): { gitPath: string; repositoryPath: string } {
        if (this.repositoryPath === null) throw new Error('No repository is open')
        return { gitPath: this.requireGitPath(), repositoryPath: this.repositoryPath }
    }
}
