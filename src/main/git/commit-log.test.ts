import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { FileDiff } from '../../shared/repository-types'
import { readCommitFiles } from './commit-files'
import { parseRefs, readCommitLog } from './commit-log'
import { readCommitFileDiff } from './file-diff'
import {
  createTestRepository,
  isolateGitEnvironment,
  testGitPath,
  type TestRepository
} from './test-repository'

describe('commit history', () => {
  let repository: TestRepository
  let gitPath: string

  function location(): { gitPath: string; repositoryPath: string } {
    return { gitPath, repositoryPath: repository.path }
  }

  function commitFile(path: string, contents: string, message = `Add ${path}`): string {
    repository.writeFile(path, contents)
    repository.git('add', '--', path)
    repository.git('commit', '-qm', message)
    return repository.git('rev-parse', 'HEAD').trim()
  }

  function addedLines(diff: FileDiff): string[] {
    if (diff.kind !== 'text') throw new Error(`Expected a text diff, got ${diff.kind}`)
    return diff.hunks
      .flatMap((hunk) => hunk.lines)
      .filter((line) => line.kind === 'added')
      .map((line) => line.text)
  }

  beforeAll(() => {
    isolateGitEnvironment()
    gitPath = testGitPath()
  })

  beforeEach(() => {
    repository = createTestRepository()
    repository.git('config', 'core.autocrlf', 'false')
  })

  afterEach(() => {
    repository.remove()
  })

  it('reads commits newest first with their parents, refs and message', async () => {
    const first = commitFile('a.txt', 'a\n')
    repository.git('tag', 'v1')
    repository.writeFile('a.txt', 'b\n')
    repository.git('commit', '-qam', 'Change a', '-m', 'Because of b.')
    const second = repository.git('rev-parse', 'HEAD').trim()

    const page = await readCommitLog(location(), 'this-branch', '', 0)

    expect(page.hasMore).toBe(false)
    expect(page.record?.typedCommand).toBe('git log')
    expect(page.commits).toEqual([
      {
        hash: second,
        parentHashes: [first],
        refs: [{ kind: 'head', name: 'main' }],
        subject: 'Change a',
        body: 'Because of b.',
        authorName: 'Test Author',
        authorEmail: 'author@example.com',
        authorDate: '2026-01-01T00:00:00+00:00'
      },
      {
        hash: first,
        parentHashes: [],
        refs: [{ kind: 'tag', name: 'v1' }],
        subject: 'Add a.txt',
        body: '',
        authorName: 'Test Author',
        authorEmail: 'author@example.com',
        authorDate: '2026-01-01T00:00:00+00:00'
      }
    ])
  })

  it('limits the log by scope', async () => {
    commitFile('base.txt', 'a\n')
    repository.git('switch', '-qc', 'side')
    commitFile('side.txt', 'a\n')
    repository.git('switch', '-q', 'main')
    commitFile('main.txt', 'a\n')
    repository.git('switch', '-qc', 'other')
    commitFile('other.txt', 'a\n')
    repository.git('switch', '-q', 'main')
    repository.git('merge', '-q', '--no-ff', '-m', 'Merge side', 'side')

    const subjects = async (scope: Parameters<typeof readCommitLog>[1]): Promise<string[]> =>
      (await readCommitLog(location(), scope, '', 0)).commits.map((commit) => commit.subject)

    expect(await subjects('all-branches')).toContain('Add other.txt')
    expect(await subjects('this-branch')).toEqual(
      expect.arrayContaining(['Merge side', 'Add side.txt', 'Add main.txt', 'Add base.txt'])
    )
    expect(await subjects('this-branch')).not.toContain('Add other.txt')
    expect(await subjects('first-parent')).toEqual(['Merge side', 'Add main.txt', 'Add base.txt'])
  })

  it('searches the message, author and hash without regard to case', async () => {
    const first = commitFile('a.txt', 'a\n', 'Fix the parser')
    commitFile('b.txt', 'a\n', 'Add a lexer')

    const subjects = async (search: string): Promise<string[]> =>
      (await readCommitLog(location(), 'this-branch', search, 0)).commits.map(
        (commit) => commit.subject
      )

    expect(await subjects('PARSER')).toEqual(['Fix the parser'])
    expect(await subjects(first.slice(0, 8))).toEqual(['Fix the parser'])
    expect(await subjects('test author')).toEqual(['Add a lexer', 'Fix the parser'])
    expect(await subjects('nothing like this')).toEqual([])
    expect((await readCommitLog(location(), 'this-branch', 'parser', 0)).record).toBeNull()
  })

  it('skips commits for later pages', async () => {
    commitFile('a.txt', 'a\n')
    commitFile('b.txt', 'a\n')

    const page = await readCommitLog(location(), 'this-branch', '', 1)

    expect(page.commits.map((commit) => commit.subject)).toEqual(['Add a.txt'])
    expect(page.record).toBeNull()
  })

  it('names HEAD when not on a branch and leaves out refs that are not branches or tags', () => {
    expect(
      parseRefs(
        'HEAD, refs/heads/main, refs/remotes/origin/main, refs/remotes/origin/HEAD, refs/stash'
      )
    ).toEqual([
      { kind: 'head', name: 'HEAD' },
      { kind: 'branch', name: 'main' },
      { kind: 'remote', name: 'origin/main' }
    ])
  })

  it('lists the files of a first commit and of a rename', async () => {
    const first = commitFile('old name.txt', 'same\ncontent\nhere\n')
    repository.git('mv', 'old name.txt', 'new name.txt')
    repository.git('commit', '-qm', 'Rename')
    const rename = repository.git('rev-parse', 'HEAD').trim()

    expect(await readCommitFiles(location(), first)).toEqual([
      { path: 'old name.txt', status: 'A' }
    ])
    expect(await readCommitFiles(location(), rename)).toEqual([
      { path: 'new name.txt', status: 'R', originalPath: 'old name.txt' }
    ])
  })

  it('compares a merge commit with its first parent', async () => {
    commitFile('base.txt', 'a\n')
    repository.git('switch', '-qc', 'side')
    commitFile('side.txt', 'from side\n')
    repository.git('switch', '-q', 'main')
    commitFile('main.txt', 'a\n')
    repository.git('merge', '-q', '--no-ff', '-m', 'Merge side', 'side')
    const merge = repository.git('rev-parse', 'HEAD').trim()

    expect(await readCommitFiles(location(), merge)).toEqual([{ path: 'side.txt', status: 'A' }])
    expect(
      addedLines(
        await readCommitFileDiff(location(), merge, { path: 'side.txt', status: 'A' }, false)
      )
    ).toEqual(['from side'])
  })

  it('reads one file of a commit and whether the diff reaches the end of the file', async () => {
    commitFile('a.txt', 'one\n')
    commitFile('b.txt', 'other\n')
    repository.writeFile('a.txt', 'one\ntwo\n')
    repository.writeFile('b.txt', 'changed\n')
    repository.git('commit', '-qam', 'Change both')
    const commit = repository.git('rev-parse', 'HEAD').trim()
    commitFile('a.txt', 'one\ntwo\nthree\n', 'Later change')

    const diff = await readCommitFileDiff(location(), commit, { path: 'a.txt', status: 'M' }, false)

    expect(addedLines(diff)).toEqual(['two'])
    expect(diff).toMatchObject({ reachesEndOfFile: true })
  })
})
