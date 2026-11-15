import { describe, expect, it } from 'vitest'
import type { DiffHunk, DiffLine } from '../../shared/repository-types'
import type { AlignedHunk } from './diff-alignment'
import { alignDiff } from './diff-alignment'
import type { SplitRow } from './diff-rows'
import { splitRows, unifiedLines, withEndOfFileLine, wordLines } from './diff-rows'

const align = (lines: DiffLine[]): AlignedHunk => alignDiff([{ header: '@@ -1 +1 @@', lines }])[0]

const context = (oldLine: number, newLine: number, text: string): DiffLine => ({
  kind: 'context',
  oldLineNumber: oldLine,
  newLineNumber: newLine,
  text
})
const removed = (oldLine: number, text: string): DiffLine => ({
  kind: 'removed',
  oldLineNumber: oldLine,
  newLineNumber: null,
  text
})
const added = (newLine: number, text: string): DiffLine => ({
  kind: 'added',
  oldLineNumber: null,
  newLineNumber: newLine,
  text
})
const noNewline: DiffLine = {
  kind: 'no-newline',
  oldLineNumber: null,
  newLineNumber: null,
  text: 'No newline at end of file'
}

describe('splitRows', () => {
  it('puts context on both sides and lines a replaced line up with its new version', () => {
    const lines = [
      context(1, 1, 'a'),
      removed(2, 'const results = index.search(terms)'),
      added(2, 'const tags = terms.filter(isTag)'),
      added(3, 'const results = index.search(words)')
    ]

    expect(
      splitRows(align(lines)).map((row) => [row.left?.line ?? null, row.right?.line ?? null])
    ).toEqual([
      [lines[0], lines[0]],
      [null, lines[2]],
      [lines[1], lines[3]]
    ])
  })

  it('marks the changed words on each side of a pair', () => {
    const [row] = splitRows(align([removed(1, 'search(terms)'), added(1, 'search(words)')]))

    expect(row.left?.segments).toEqual([
      { kind: 'common', text: 'search(' },
      { kind: 'removed', text: 'terms' },
      { kind: 'common', text: ')' }
    ])
    expect(row.right?.segments).toEqual([
      { kind: 'common', text: 'search(' },
      { kind: 'added', text: 'words' },
      { kind: 'common', text: ')' }
    ])
  })

  it('puts dissimilar replaced lines on one row', () => {
    const lines = [removed(1, 'alpha beta'), added(1, 'gamma delta')]

    expect(
      splitRows(align(lines)).map((row) => [row.left?.line ?? null, row.right?.line ?? null])
    ).toEqual([[lines[0], lines[1]]])
  })

  it('shows a new file on the right with an empty left side', () => {
    expect(
      splitRows(align([added(1, 'a'), added(2, 'b')])).map((row) => [row.left, row.right?.kind])
    ).toEqual([
      [null, 'added'],
      [null, 'added']
    ])
  })

  it('puts each side’s missing newline note after that side’s last line', () => {
    const lines = [removed(1, 'value = 1'), noNewline, added(1, 'value = 2'), noNewline]

    expect(
      splitRows(align(lines)).map((row) => [row.left?.line ?? null, row.right?.line ?? null])
    ).toEqual([
      [lines[0], lines[2]],
      [noNewline, null],
      [null, noNewline]
    ])
  })

  it('keeps a missing newline note on the side it belongs to', () => {
    const lines = [removed(1, 'value = 1'), noNewline, added(1, 'value = 2')]

    expect(
      splitRows(align(lines)).map((row) => [row.left?.line ?? null, row.right?.line ?? null])
    ).toEqual([
      [lines[0], lines[2]],
      [noNewline, null]
    ])
  })
})

describe('word marks', () => {
  it('marks an edit that adds more text than it keeps', () => {
    const [line] = unifiedLines(
      align([removed(1, 'if (user.isAdmin) {'), added(1, 'if (user.role === "admin") {')])
    )

    expect(line.segments?.filter((segment) => segment.kind !== 'common')).toEqual([
      { kind: 'removed', text: 'isA' }
    ])
  })

  it('lines an edit up with its new version however many lines are added above it', () => {
    const newLines = Array.from({ length: 25 }, (_, index) =>
      added(index + 1, `log("step ${index}");`)
    )
    const lines = [
      removed(1, 'const total = sum(items);'),
      ...newLines,
      added(26, 'const total = sum(items) + tax;')
    ]

    expect(splitRows(align(lines)).at(-1)).toEqual({
      left: { line: lines[0], kind: 'removed', segments: undefined },
      right: {
        line: lines[26],
        kind: 'added',
        segments: [
          { kind: 'common', text: 'const total = sum(items)' },
          { kind: 'added', text: ' + tax' },
          { kind: 'common', text: ';' }
        ]
      }
    })
  })
})

describe('blank lines between changes', () => {
  // Git matches old blank line 8 with new blank line 12, which splits this edit into two blocks.
  const lines = [
    removed(7, 'let retries = 3;'),
    added(7, 'console.log();'),
    added(8, ''),
    added(9, 'const color = "red";'),
    added(10, ''),
    added(11, ''),
    context(8, 12, ''),
    removed(9, 'const colour = "red";')
  ]
  const numbers = (row: SplitRow): (number | null)[] => [
    row.left?.line.oldLineNumber ?? null,
    row.right?.line.newLineNumber ?? null
  ]

  it('lines each edit up with its new version across the blank lines', () => {
    expect(splitRows(align(lines)).map(numbers)).toEqual([
      [7, 7],
      [8, 8],
      [9, 9],
      [null, 10],
      [null, 11],
      [null, 12]
    ])
  })

  it('shows a blank line matched with a blank line as unchanged', () => {
    expect(splitRows(align(lines))[1].left?.kind).toBe('context')
  })

  it('draws the blank line git kept as added where it no longer lines up', () => {
    expect(splitRows(align(lines)).at(-1)?.right).toMatchObject({ line: lines[6], kind: 'added' })
  })

  it('keeps the unified view in git order and marks words across the blank line', () => {
    const marked = unifiedLines(align(lines))

    expect(marked.map((item) => item.line)).toEqual(lines)
    expect(marked[7].segments?.find((segment) => segment.kind === 'removed')?.text).toBe('u')
  })
})

describe('alignDiff', () => {
  it('returns the same pairing for the same diff arriving as new objects', () => {
    const hunk = (): DiffHunk => ({
      header: '@@ -1 +1 @@',
      lines: [removed(1, 'a = 1'), added(1, 'a = 2')]
    })

    expect(alignDiff([hunk()])).toBe(alignDiff([hunk()]))
  })
})

describe('unifiedLines', () => {
  it('keeps the line order and marks changed text, including a whole inserted line', () => {
    const lines = [
      removed(1, 'search(terms)'),
      added(1, 'const tags = 1'),
      added(2, 'search(words)')
    ]
    const marked = unifiedLines(align(lines))

    expect(marked.map((item) => item.line)).toEqual(lines)
    expect(marked[1].segments).toEqual([{ kind: 'added', text: 'const tags = 1' }])
    expect(marked[2].segments?.find((segment) => segment.kind !== 'common')).toEqual({
      kind: 'added',
      text: 'words'
    })
  })
})

describe('wordLines', () => {
  it('marks the changed words of a replaced line and keeps both line numbers', () => {
    expect(wordLines(align([removed(4, 'search(terms)'), added(5, 'search(words)')]))).toEqual([
      {
        oldLineNumber: 4,
        newLineNumber: 5,
        isNote: false,
        segments: [
          { kind: 'common', text: 'search(' },
          { kind: 'removed', text: 'terms' },
          { kind: 'added', text: 'words' },
          { kind: 'common', text: ')' }
        ]
      }
    ])
  })

  it('pairs a removed line with the added line it most resembles', () => {
    const lines = wordLines(
      align([
        removed(2, 'const results = index.search(terms)'),
        added(2, 'const tags = terms.filter(isTag)'),
        added(3, 'const results = index.search(words)')
      ])
    )

    expect(lines.map((line) => [line.oldLineNumber, line.newLineNumber])).toEqual([
      [null, 2],
      [2, 3]
    ])
    expect(lines[0].segments).toEqual([{ kind: 'added', text: 'const tags = terms.filter(isTag)' }])
  })

  it('shows a replaced line whole when it shares no text with the new one', () => {
    expect(wordLines(align([removed(1, 'open file'), added(1, 'quit')]))).toEqual([
      {
        oldLineNumber: 1,
        newLineNumber: null,
        isNote: false,
        segments: [{ kind: 'removed', text: 'open file' }]
      },
      {
        oldLineNumber: null,
        newLineNumber: 1,
        isNote: false,
        segments: [{ kind: 'added', text: 'quit' }]
      }
    ])
  })

  it('shows unmatched lines whole', () => {
    expect(wordLines(align([context(1, 1, 'a'), added(2, 'new')]))).toEqual([
      {
        oldLineNumber: 1,
        newLineNumber: 1,
        isNote: false,
        segments: [{ kind: 'common', text: 'a' }]
      },
      {
        oldLineNumber: null,
        newLineNumber: 2,
        isNote: false,
        segments: [{ kind: 'added', text: 'new' }]
      }
    ])
  })

  it('shows a newline added at the end of the file as an added final line', () => {
    const hunks = withEndOfFileLine([
      { header: '@@ -1 +1 @@', lines: [removed(1, 'a'), noNewline, added(1, 'a')] }
    ])
    const lines = wordLines(alignDiff(hunks)[0])

    expect(
      lines.map((line) => [line.oldLineNumber, line.newLineNumber, line.segments[0].kind])
    ).toEqual([
      [1, 1, 'common'],
      [null, null, 'common'],
      [null, 2, 'added']
    ])
    expect(lines[1].isNote).toBe(true)
  })
})

describe('withEndOfFileLine', () => {
  const finalLine = (lines: DiffLine[]): DiffLine | undefined =>
    withEndOfFileLine([{ header: '@@ -1 +1 @@', lines }])[0].lines.at(-1)

  it('adds the empty line after the last line break on both sides', () => {
    expect(finalLine([context(8, 11, 'x'), removed(9, 'a'), added(12, 'b')])).toEqual({
      kind: 'context',
      oldLineNumber: 10,
      newLineNumber: 13,
      text: ''
    })
  })

  it('leaves it off a side that ends without a line break', () => {
    expect(finalLine([removed(1, 'a'), noNewline, added(1, 'a')])).toMatchObject({
      oldLineNumber: null,
      newLineNumber: 2
    })
    expect(finalLine([context(1, 1, 'a'), noNewline])).toEqual(noNewline)
  })

  it('leaves it off the old side of a new file', () => {
    expect(finalLine([added(1, 'a'), added(2, 'b')])).toMatchObject({
      oldLineNumber: null,
      newLineNumber: 3
    })
  })

  it('shows a one-sided final line next to an empty cell in Split', () => {
    const hunk = withEndOfFileLine([{ header: '@@ -0,0 +1 @@', lines: [added(1, 'a')] }])

    expect(splitRows(alignDiff(hunk)[0]).at(-1)?.left).toBeNull()
  })
})
