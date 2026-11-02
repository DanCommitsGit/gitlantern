import { basename, normalize } from 'node:path'
import {
  commitAction,
  stageAllAction,
  stageFilesAction,
  unstageAllAction,
  unstageFilesAction
} from '../shared/git-actions'
import type { CommandRecord } from '../shared/command-record'
import type { GitCheck, Identity, OpenResult } from '../shared/gitlantern-api'
import type { FileChange, FileDiff, RepositoryStatus } from '../shared/repository-types'
import { readFileDiff } from './git/file-diff'
import { findGitPath } from './git/find-git'
import { isSupportedGitVersion } from './git/git-version'
import { readRepositoryStatus } from './git/repository-status'
import { runAction } from './git/run-action'
import { runGit } from './git/run-git'

const MAX_RECENT_REPOSITORIES = 10

export interface AppData {
  recentRepositories: string[]
  gitLocation: string | null
}

export interface AppDataStore {
  get<Key extends keyof AppData>(key: Key): AppData[Key]
  set<Key extends keyof AppData>(key: Key, value: AppData[Key]): void
}

export class RepositorySession {
  private gitPath: string | null = null
  private repositoryPath: string | null = null

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
    return this.finishOpening(repositoryPath)
  }

  close(): void {
    this.repositoryPath = null
  }

  async readStatus(): Promise<RepositoryStatus> {
    return readRepositoryStatus(this.requireRepository())
  }

  async readDiff(change: FileChange, staged: boolean, showLarge: boolean): Promise<FileDiff> {
    return readFileDiff(this.requireRepository(), change, staged, showLarge)
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

  private async finishOpening(repositoryPath: string): Promise<OpenResult> {
    this.repositoryPath = repositoryPath
    const recentPaths = this.store
      .get('recentRepositories')
      .filter((path) => path !== repositoryPath)
    this.store.set(
      'recentRepositories',
      [repositoryPath, ...recentPaths].slice(0, MAX_RECENT_REPOSITORIES)
    )

    return {
      kind: 'opened',
      repository: {
        path: repositoryPath,
        name: basename(repositoryPath),
        identity: await this.readIdentity(this.requireRepository())
      }
    }
  }

  private async readIdentity(repository: {
    gitPath: string
    repositoryPath: string
  }): Promise<Identity> {
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
