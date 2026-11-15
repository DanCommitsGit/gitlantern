import { chmodSync, existsSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { DiffLine, FileDiff } from '../../shared/repository-types'
import { readFileDiff } from './file-diff'
import {
  createTestRepository,
  isolateGitEnvironment,
  testGitPath,
  type TestRepository
} from './test-repository'

function textLines(diff: FileDiff): DiffLine[] {
  if (diff.kind !== 'text') throw new Error(`Expected a text diff, got ${diff.kind}`)
  return diff.hunks.flatMap((hunk) => hunk.lines)
}

describe('readFileDiff', () => {
  let repository: TestRepository
  let gitPath: string

  function diff(
    change: {
      path: string
      status: 'M' | 'A' | 'D' | 'R' | 'T' | 'U' | '?'
      originalPath?: string
    },
    staged: boolean,
    showLarge = false
  ): Promise<FileDiff> {
    return readFileDiff({ gitPath, repositoryPath: repository.path }, change, staged, showLarge)
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

  function commitFile(path: string, contents: string): void {
    repository.writeFile(path, contents)
    repository.git('add', '--', path)
    repository.git('commit', '-qm', `Add ${path}`)
  }

  it('numbers context, added and removed lines', async () => {
    commitFile('a.txt', 'one\ntwo\nthree\n')
    repository.writeFile('a.txt', 'one\nTWO\nthree\n')

    expect(textLines(await diff({ path: 'a.txt', status: 'M' }, false))).toEqual([
      { kind: 'context', oldLineNumber: 1, newLineNumber: 1, text: 'one' },
      { kind: 'removed', oldLineNumber: 2, newLineNumber: null, text: 'two' },
      { kind: 'added', oldLineNumber: null, newLineNumber: 2, text: 'TWO' },
      { kind: 'context', oldLineNumber: 3, newLineNumber: 3, text: 'three' }
    ])
  })

  it('keeps hunk headers', async () => {
    commitFile('a.txt', 'one\n')
    repository.writeFile('a.txt', 'two\n')

    const result = await diff({ path: 'a.txt', status: 'M' }, false)

    expect(result).toMatchObject({ kind: 'text', hunks: [{ header: '@@ -1 +1 @@' }] })
  })

  it('reads the staged version when asked', async () => {
    commitFile('a.txt', 'one\n')
    repository.writeFile('a.txt', 'staged\n')
    repository.git('add', 'a.txt')
    repository.writeFile('a.txt', 'unstaged\n')

    const stagedText = textLines(await diff({ path: 'a.txt', status: 'M' }, true)).map(
      (line) => line.text
    )
    const unstagedText = textLines(await diff({ path: 'a.txt', status: 'M' }, false)).map(
      (line) => line.text
    )

    expect(stagedText).toEqual(['one', 'staged'])
    expect(unstagedText).toEqual(['staged', 'unstaged'])
  })

  it('treats lines that look like diff headers as content', async () => {
    commitFile('sql.txt', '-- comment one\nkeep\n++ counter\n')
    repository.writeFile('sql.txt', '-- comment two\nkeep\n++ tally\n')

    const lines = textLines(await diff({ path: 'sql.txt', status: 'M' }, false))

    expect(lines.map((line) => [line.kind, line.text])).toEqual([
      ['removed', '-- comment one'],
      ['added', '-- comment two'],
      ['context', 'keep'],
      ['removed', '++ counter'],
      ['added', '++ tally']
    ])
  })

  it('marks a missing newline at the end of a file', async () => {
    commitFile('a.txt', 'line')
    repository.writeFile('a.txt', 'changed')

    const lines = textLines(await diff({ path: 'a.txt', status: 'M' }, false))

    expect(lines.map((line) => line.kind)).toEqual(['removed', 'no-newline', 'added', 'no-newline'])
  })

  it('removes carriage returns from displayed text', async () => {
    commitFile('a.txt', 'first\r\nsecond\r\n')
    repository.writeFile('a.txt', 'first\r\nchanged\r\n')

    expect(textLines(await diff({ path: 'a.txt', status: 'M' }, false))).toContainEqual({
      kind: 'added',
      oldLineNumber: null,
      newLineNumber: 2,
      text: 'changed'
    })
  })

  it('shows an untracked file as all added lines', async () => {
    repository.writeFile('with space é.txt', 'hello\nworld\n')

    const lines = textLines(await diff({ path: 'with space é.txt', status: '?' }, false))

    expect(lines.map((line) => [line.kind, line.text])).toEqual([
      ['added', 'hello'],
      ['added', 'world']
    ])
  })

  it('reads a file whose name git would treat as a pattern', async () => {
    commitFile('a[1].txt', 'one\n')
    commitFile('a1.txt', 'one\n')
    repository.writeFile('a[1].txt', 'two\n')
    repository.writeFile('a1.txt', 'other\n')

    const lines = textLines(await diff({ path: 'a[1].txt', status: 'M' }, false))

    expect(lines.map((line) => line.text)).toEqual(['one', 'two'])
  })

  it('reports binary files', async () => {
    commitFile('image.bin', '')
    writeFileSync(join(repository.path, 'image.bin'), Buffer.from([0, 1, 2, 0, 255]))

    const result = await diff({ path: 'image.bin', status: 'M' }, false)

    expect(result.kind).toBe('binary')
    expect(result).toMatchObject({
      details: expect.stringContaining('Binary files')
    })
  })

  it('reports a rename with no edits as no content change', async () => {
    commitFile('old.txt', 'same\ncontent\nhere\n')
    repository.git('mv', 'old.txt', 'new.txt')

    const result = await diff({ path: 'new.txt', status: 'R', originalPath: 'old.txt' }, true)

    expect(result.kind).toBe('no-content-change')
    expect(result).toMatchObject({ details: expect.stringContaining('rename from old.txt') })
  })

  it('shows only the edits of a rename with edits', async () => {
    commitFile('old.txt', 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\n')
    repository.git('mv', 'old.txt', 'new.txt')
    repository.writeFile('new.txt', 'one\ntwo\nthree\nfour\nfive\nsix\nseven\nEIGHT\n')
    repository.git('add', 'new.txt')

    const lines = textLines(
      await diff({ path: 'new.txt', status: 'R', originalPath: 'old.txt' }, true)
    )

    expect(lines.filter((line) => line.kind !== 'context').map((line) => line.text)).toEqual([
      'eight',
      'EIGHT'
    ])
  })

  it('reports a file mode change as no content change', async () => {
    commitFile('run.sh', 'echo hi\n')
    repository.git('update-index', '--chmod=+x', 'run.sh')

    const result = await diff({ path: 'run.sh', status: 'M' }, true)

    expect(result).toMatchObject({
      kind: 'no-content-change',
      details: expect.stringContaining('new mode 100755')
    })
  })

  it('reports a staged empty file as no content change', async () => {
    repository.writeFile('empty.txt', '')
    repository.git('add', 'empty.txt')

    expect((await diff({ path: 'empty.txt', status: 'A' }, true)).kind).toBe('no-content-change')
  })

  it('shows a deleted file as removed lines', async () => {
    commitFile('a.txt', 'bye\n')
    rmSync(join(repository.path, 'a.txt'))

    const lines = textLines(await diff({ path: 'a.txt', status: 'D' }, false))

    expect(lines).toEqual([{ kind: 'removed', oldLineNumber: 1, newLineNumber: null, text: 'bye' }])
  })

  it('reports a conflicted file without reading a diff', async () => {
    await expect(diff({ path: 'a.txt', status: 'U' }, false)).resolves.toEqual({
      kind: 'conflict'
    })
  })

  it('holds back a very large diff until asked', async () => {
    commitFile('big.txt', '')
    repository.writeFile('big.txt', 'line\n'.repeat(6000))

    const heldBack = await diff({ path: 'big.txt', status: 'M' }, false)
    expect(heldBack.kind).toBe('too-large')

    const shown = await diff({ path: 'big.txt', status: 'M' }, false, true)
    expect(textLines(shown)).toHaveLength(6000)
  })

  it('does not run a program from diff.external', async () => {
    commitFile('a.txt', 'one\n')
    repository.writeFile('a.txt', 'two\n')
    const markerPath = join(repository.path, 'external-ran.txt').replaceAll('\\', '/')
    const scriptPath = join(repository.path, '.git', 'external.sh')
    writeFileSync(scriptPath, `#!/bin/sh\necho ran > "${markerPath}"\n`)
    chmodSync(scriptPath, 0o755)
    repository.git('config', 'diff.external', scriptPath.replaceAll('\\', '/'))

    await diff({ path: 'a.txt', status: 'M' }, false)

    expect(existsSync(markerPath)).toBe(false)

    repository.git('diff')
    expect(existsSync(markerPath)).toBe(true)
  })

  describe('reachesEndOfFile', () => {
    const tenLines = 'one\ntwo\nthree\nfour\nfive\nsix\nseven\neight\nnine\nten\n'

    async function reachesEnd(edited: string, staged = false): Promise<boolean> {
      commitFile('a.txt', tenLines)
      repository.writeFile('a.txt', edited)
      if (staged) repository.git('add', '--', 'a.txt')
      const result = await diff({ path: 'a.txt', status: 'M' }, staged)
      if (result.kind !== 'text') throw new Error(`Expected a text diff, got ${result.kind}`)
      return result.reachesEndOfFile
    }

    it('is true when the change is at the end', async () => {
      expect(await reachesEnd(tenLines.replace('ten', 'TEN'))).toBe(true)
    })

    it('is true when the file ends exactly three lines after the change', async () => {
      expect(await reachesEnd(tenLines.replace('seven', 'SEVEN'))).toBe(true)
    })

    it('is false when the file goes on past the last hunk', async () => {
      expect(await reachesEnd(tenLines.replace('two', 'TWO'))).toBe(false)
    })

    it('counts a last line without a line break', async () => {
      expect(await reachesEnd(tenLines.replace('ten\n', 'ten'))).toBe(true)
    })

    it('reads the staged version for a staged change at the end', async () => {
      expect(await reachesEnd(tenLines.replace('ten', 'TEN'), true)).toBe(true)
    })

    it('reads the staged version for a staged change near the start', async () => {
      expect(await reachesEnd(tenLines.replace('two', 'TWO'), true)).toBe(false)
    })

    it('is true for a new or deleted file', async () => {
      repository.writeFile('new.txt', 'a\nb\n')
      const created = await diff({ path: 'new.txt', status: '?' }, false)
      commitFile('old.txt', 'a\nb\n')
      repository.git('rm', '-q', '--', 'old.txt')
      const deleted = await diff({ path: 'old.txt', status: 'D' }, true)

      expect([created, deleted]).toMatchObject([
        { kind: 'text', reachesEndOfFile: true },
        { kind: 'text', reachesEndOfFile: true }
      ])
    })
  })
})
