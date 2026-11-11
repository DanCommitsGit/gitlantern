import { execFile } from 'node:child_process'
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { runGit } from './run-git'
import {
  createTestRepository,
  isolateGitEnvironment,
  testGitPath,
  type TestRepository
} from './test-repository'

describe('runGit', () => {
  let repository: TestRepository
  let gitPath: string

  beforeAll(() => {
    isolateGitEnvironment()
    gitPath = testGitPath()
  })

  beforeEach(() => {
    repository = createTestRepository()
  })

  afterEach(() => {
    repository.remove()
  })

  it.runIf(process.platform === 'win32')(
    'runs real git when the repo folder contains a git.exe',
    async () => {
      const plantedGitPath = join(repository.path, 'git.exe')
      copyFileSync(process.execPath, plantedGitPath)

      const bareNameResult = await promisify(execFile)('git', ['--version'], {
        cwd: repository.path
      })
      expect(bareNameResult.stdout).toBe(`${process.version}\r\n`)

      const result = await runGit({
        gitPath,
        repositoryPath: repository.path,
        gitArguments: ['--version']
      })
      expect(result.stdout.toString()).toMatch(/^git version /)
    },
    30_000
  )

  it('passes the repository with -C and returns the full arguments that ran', async () => {
    const result = await runGit({
      gitPath,
      repositoryPath: repository.path,
      gitArguments: ['rev-parse', '--is-inside-work-tree']
    })

    expect(result.exitCode).toBe(0)
    expect(result.stdout.toString().trim()).toBe('true')
    expect(result.fullArguments).toEqual([
      '-C',
      repository.path,
      '-c',
      'safe.bareRepository=explicit',
      'rev-parse',
      '--is-inside-work-tree'
    ])
  })

  it('runs without a repository', async () => {
    const result = await runGit({ gitPath, gitArguments: ['--version'] })

    expect(result.stdout.toString()).toMatch(/^git version /)
  })

  it('returns a failing exit code and stderr instead of throwing', async () => {
    const result = await runGit({
      gitPath,
      repositoryPath: repository.path,
      gitArguments: ['rev-parse', '--verify', 'does-not-exist']
    })

    expect(result.exitCode).toBe(128)
    expect(result.stderr.toString()).toContain('fatal')
  })

  it('throws when git cannot start', async () => {
    await expect(
      runGit({ gitPath: join(repository.path, 'missing-git'), gitArguments: ['--version'] })
    ).rejects.toThrow()
  })

  it('sends stdin to git', async () => {
    const result = await runGit({
      gitPath,
      repositoryPath: repository.path,
      gitArguments: ['commit', '--allow-empty', '-q', '-F', '-'],
      stdin: 'Message with é from stdin\n'
    })

    expect(result.exitCode).toBe(0)
    expect(repository.git('log', '-1', '--format=%s').trim()).toBe('Message with é from stdin')
  })

  it('keeps output bytes that are not valid UTF-8', async () => {
    const latin1Bytes = Buffer.from([0x63, 0x61, 0x66, 0xe9, 0x0a])
    writeFileSync(join(repository.path, 'latin1.txt'), latin1Bytes)
    repository.git('add', 'latin1.txt')

    const result = await runGit({
      gitPath,
      repositoryPath: repository.path,
      gitArguments: ['diff', '--cached', '--no-ext-diff']
    })

    expect(result.stdout.includes(Buffer.from([0xe9]))).toBe(true)
  })

  it('does not treat a bare repository inside a clone as a repository', async () => {
    const bareFolder = join(repository.path, 'sub', 'bare.git')
    mkdirSync(join(repository.path, 'sub'), { recursive: true })
    repository.git('init', '-q', '--bare', bareFolder)

    const withoutProtection = await promisify(execFile)(
      gitPath,
      ['-C', bareFolder, 'rev-parse', '--is-bare-repository'],
      { encoding: 'utf8' }
    )
    expect(withoutProtection.stdout.trim()).toBe('true')

    const result = await runGit({
      gitPath,
      repositoryPath: bareFolder,
      gitArguments: ['rev-parse', '--is-bare-repository']
    })
    expect(result.exitCode).toBe(128)
    expect(result.stderr.toString()).toContain('safe.bareRepository')
  })
})
