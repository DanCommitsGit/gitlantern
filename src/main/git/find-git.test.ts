import { chmodSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findGitPath } from './find-git'

const executableName = process.platform === 'win32' ? 'git.exe' : 'git'

describe('findGitPath', () => {
    let folder: string

    function plantGit(folderName: string): string {
        const gitFolder = join(folder, folderName)
        mkdirSync(gitFolder, { recursive: true })
        const gitPath = join(gitFolder, executableName)
        writeFileSync(gitPath, '')
        chmodSync(gitPath, 0o755)
        return gitPath
    }

    beforeEach(() => {
        folder = realpathSync(mkdtempSync(join(tmpdir(), 'gitlantern-find-git-')))
    })

    afterEach(() => {
        rmSync(folder, { recursive: true, force: true, maxRetries: 5 })
    })

    it('returns the first match in PATH order', () => {
        const firstGitPath = plantGit('first')
        plantGit('second')
        const searchPath = [join(folder, 'first'), join(folder, 'second')].join(delimiter)

        expect(findGitPath(searchPath)).toBe(firstGitPath)
    })

    it('skips folders without git', () => {
        const gitPath = plantGit('has-git')
        const searchPath = [join(folder, 'missing'), join(folder, 'has-git')].join(delimiter)

        expect(findGitPath(searchPath)).toBe(gitPath)
    })

    it('ignores relative and empty PATH entries, which depend on the current folder', () => {
        plantGit('relative')
        const previousFolder = process.cwd()
        process.chdir(folder)
        try {
            expect(findGitPath(['relative', '.', '', '..'].join(delimiter))).toBeNull()
        } finally {
            process.chdir(previousFolder)
        }
    })

    it('ignores a folder named like the executable', () => {
        mkdirSync(join(folder, 'folder-trap', executableName), { recursive: true })

        expect(findGitPath(join(folder, 'folder-trap'))).toBeNull()
    })

    it('returns null when git is not found', () => {
        expect(findGitPath('')).toBeNull()
    })
})
