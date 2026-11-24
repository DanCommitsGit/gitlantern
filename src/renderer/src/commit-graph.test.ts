import { describe, expect, it } from 'vitest'
import { graphColumnCount, layoutCommitGraph } from './commit-graph'

describe('layoutCommitGraph', () => {
    it('keeps a straight history in one column', () => {
        const rows = layoutCommitGraph([
            { hash: 'c', parentHashes: ['b'] },
            { hash: 'b', parentHashes: ['a'] },
            { hash: 'a', parentHashes: [] }
        ])

        expect(rows.map((row) => row.column)).toEqual([0, 0, 0])
        expect(rows[1].lines).toEqual([
            { fromColumn: 0, toColumn: 0, part: 'top', lane: 0 },
            { fromColumn: 0, toColumn: 0, part: 'bottom', lane: 0 }
        ])
        expect(rows[2].lines).toEqual([{ fromColumn: 0, toColumn: 0, part: 'top', lane: 0 }])
        expect(graphColumnCount(rows)).toBe(1)
    })

    it('opens a lane for a merged branch and closes it where the branch started', () => {
        const rows = layoutCommitGraph([
            { hash: 'merge', parentHashes: ['main', 'side'] },
            { hash: 'main', parentHashes: ['base'] },
            { hash: 'side', parentHashes: ['base'] },
            { hash: 'base', parentHashes: [] }
        ])

        expect(rows.map((row) => row.column)).toEqual([0, 0, 1, 0])
        expect(rows[0].lines).toEqual([
            { fromColumn: 0, toColumn: 0, part: 'bottom', lane: 0 },
            { fromColumn: 0, toColumn: 1, part: 'bottom', lane: 1 }
        ])
        expect(rows[1].lines).toContainEqual({ fromColumn: 1, toColumn: 1, part: 'through', lane: 1 })
        // The side branch joins the lane already going down to the base.
        expect(rows[2].lines).toContainEqual({ fromColumn: 1, toColumn: 0, part: 'bottom', lane: 0 })
        expect(rows[3].lines).toEqual([{ fromColumn: 0, toColumn: 0, part: 'top', lane: 0 }])
        expect(graphColumnCount(rows)).toBe(2)
    })

    it('puts a second branch tip in its own column, joined to the lane of its parent', () => {
        const rows = layoutCommitGraph([
            { hash: 'tip-one', parentHashes: ['base'] },
            { hash: 'tip-two', parentHashes: ['base'] },
            { hash: 'base', parentHashes: ['root'] },
            { hash: 'root', parentHashes: [] }
        ])

        expect(rows.map((row) => row.column)).toEqual([0, 1, 0, 0])
        expect(rows[1].lines).toEqual([
            { fromColumn: 0, toColumn: 0, part: 'through', lane: 0 },
            { fromColumn: 1, toColumn: 0, part: 'bottom', lane: 0 }
        ])
        expect(rows[2].lines).toEqual([
            { fromColumn: 0, toColumn: 0, part: 'top', lane: 0 },
            { fromColumn: 0, toColumn: 0, part: 'bottom', lane: 0 }
        ])
    })

    it('reuses a lane once its branch has ended', () => {
        const rows = layoutCommitGraph([
            { hash: 'main-tip', parentHashes: ['main-root'] },
            { hash: 'old-root', parentHashes: [] },
            { hash: 'other-tip', parentHashes: ['other-root'] },
            { hash: 'main-root', parentHashes: [] },
            { hash: 'other-root', parentHashes: [] }
        ])

        expect(rows.map((row) => row.column)).toEqual([0, 1, 1, 0, 1])
    })

    it('has no columns for an empty log', () => {
        expect(graphColumnCount([])).toBe(0)
    })
})
