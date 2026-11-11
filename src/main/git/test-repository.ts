import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { findGitPath } from './find-git'

export function isolateGitEnvironment(): void {
  // The search for a bare command name reads this from the parent process, not the child's env.
  delete process.env['NoDefaultCurrentDirectoryInExePath']
  process.env['GIT_CONFIG_NOSYSTEM'] = '1'
  process.env['GIT_CONFIG_GLOBAL'] = process.platform === 'win32' ? 'NUL' : '/dev/null'
  process.env['GIT_AUTHOR_NAME'] = 'Test Author'
  process.env['GIT_AUTHOR_EMAIL'] = 'author@example.com'
  process.env['GIT_AUTHOR_DATE'] = '2026-01-01T00:00:00Z'
  process.env['GIT_COMMITTER_NAME'] = 'Test Committer'
  process.env['GIT_COMMITTER_EMAIL'] = 'committer@example.com'
  process.env['GIT_COMMITTER_DATE'] = '2026-01-01T00:00:00Z'
}

export function testGitPath(): string {
  const gitPath = findGitPath()
  if (gitPath === null) throw new Error('These tests need git on PATH')
  return gitPath
}

export interface TestRepository {
  path: string
  git(...gitArguments: string[]): string
  writeFile(relativePath: string, contents: string): void
  writeExecutable(relativePath: string, contents: string): void
  remove(): void
}

export function createTestRepository(): TestRepository {
  // Only the native call expands Windows short names such as RUNNER~1, which git reports in full.
  const path = realpathSync.native(mkdtempSync(join(tmpdir(), 'gitlantern-test-')))
  const gitPath = testGitPath()

  const repository: TestRepository = {
    path,
    git: (...gitArguments) =>
      execFileSync(gitPath, ['-C', path, ...gitArguments], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      }),
    writeFile: (relativePath, contents) => {
      const filePath = join(path, relativePath)
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, contents)
    },
    writeExecutable: (relativePath, contents) => {
      repository.writeFile(relativePath, contents)
      chmodSync(join(path, relativePath), 0o755)
    },
    remove: () => rmSync(path, { recursive: true, force: true, maxRetries: 5 })
  }

  repository.git('init', '-q', '-b', 'main')
  return repository
}
