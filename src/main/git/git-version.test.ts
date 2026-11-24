import { describe, expect, it } from 'vitest'
import { isSupportedGitVersion } from './git-version'

describe('isSupportedGitVersion', () => {
    it.each([
        ['git version 2.38.0', true],
        ['git version 2.43.0.windows.1', true],
        ['git version 2.39.5 (Apple Git-154)', true],
        ['git version 3.0.0', true],
        ['git version 2.37.9', false],
        ['git version 2.9.5', false],
        ['git version 1.99.0', false],
        ['not git output', false],
        ['', false]
    ])('%j is %s', (versionOutput, expected) => {
        expect(isSupportedGitVersion(versionOutput)).toBe(expected)
    })
})
