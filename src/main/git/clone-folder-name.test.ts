import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { cloneFolderName } from '../../shared/clone-folder-name'
import { isolateGitEnvironment, testGitPath } from './test-repository'

describe('cloneFolderName beside git clone', () => {
    let workFolder: string

    beforeAll(() => {
        isolateGitEnvironment()
        workFolder = mkdtempSync(join(tmpdir(), 'gitlantern-names-'))
    })

    afterAll(() => {
        rmSync(workFolder, { recursive: true, force: true, maxRetries: 5 })
    })

    it.each([
        'https://example.invalid/you/repo.git',
        'https://example.invalid/you/repo.git/',
        'https://example.invalid/you/repo/.git',
        'https://example.invalid/you/repo .git',
        'https://example.invalid/you/two  spaces',
        'https://example.invalid/you/repo.bundle',
        'https://example.invalid/you/repo.GIT',
        'https://user:secret@example.invalid',
        'https://user@name@example.invalid/',
        'ssh://git@example.invalid:2222/.git',
        'ssh://example.invalid:2222',
        'ssh://example.invalid/srv/2222.git',
        'git@example.invalid:repo.git',
        'example.invalid:foo/.git',
        'example.invalid:2222.git'
    ])('gives %j the name git gives it', (url) => {
        // Git announces the folder and then stops, because no protocol is allowed.
        const clone = spawnSync(testGitPath(), ['clone', '--', url], {
            cwd: workFolder,
            encoding: 'utf8',
            env: { ...process.env, GIT_ALLOW_PROTOCOL: 'none', LC_ALL: 'C' }
        })
        const gitName = /Cloning into '(.*)'\.\.\./.exec(clone.stderr)?.[1]

        expect(cloneFolderName(url)).toBe(gitName)
    })
})
