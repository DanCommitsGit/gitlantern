import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { findRepositoryPrograms } from './repository-trust'
import {
    createTestRepository,
    isolateGitEnvironment,
    testGitPath,
    type TestRepository
} from './test-repository'

describe('findRepositoryPrograms', () => {
    let repository: TestRepository
    let gitPath: string

    function programs(): ReturnType<typeof findRepositoryPrograms> {
        return findRepositoryPrograms({ gitPath, repositoryPath: repository.path })
    }

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

    it('finds nothing in an ordinary repository, whose hooks are only samples', async () => {
        repository.writeFile('.git/hooks/pre-commit.sample', '#!/bin/sh\n')

        await expect(programs()).resolves.toEqual([])
    })

    it.each([
        ['core.fsmonitor', './watch.sh'],
        ['core.sshCommand', 'ssh -i key'],
        ['core.hooksPath', '.husky/_'],
        ['core.pager', 'less'],
        ['core.editor', 'vim'],
        ['core.askPass', './ask.sh'],
        ['core.gitProxy', './proxy.sh'],
        ['diff.external', './diff.sh'],
        ['diff.anything.textconv', './convert.sh'],
        ['diff.anything.command', './diff.sh'],
        ['filter.anything.clean', './clean.sh'],
        ['filter.anything.smudge', './smudge.sh'],
        ['filter.anything.process', './process.sh'],
        ['merge.anything.driver', './merge.sh'],
        ['difftool.anything.cmd', './tool.sh'],
        ['mergetool.anything.cmd', './tool.sh'],
        ['credential.helper', './helper.sh'],
        ['credential.https://example.com.helper', './helper.sh'],
        ['gpg.program', './gpg.sh'],
        ['gpg.ssh.program', './gpg.sh'],
        ['sequence.editor', './editor.sh'],
        ['pager.log', './pager.sh'],
        ['remote.origin.uploadpack', './upload.sh'],
        ['remote.origin.receivepack', './receive.sh'],
        ['remote.origin.vcs', 'anything'],
        ['submodule.anything.update', '!./update.sh'],
        ['trailer.anything.command', './trailer.sh'],
        ['trailer.anything.cmd', './trailer.sh'],
        ['browser.anything.cmd', './browser.sh'],
        ['man.anything.cmd', './man.sh'],
        ['hook.anything.command', './hook.sh'],
        ['alias.anything', '!./alias.sh']
    ])('flags %s', async (settingName, settingValue) => {
        repository.git('config', settingName, settingValue)

        await expect(programs()).resolves.toEqual([
            { kind: 'setting', name: settingName.toLowerCase(), value: settingValue }
        ])
    })

    it.each([
        ['core.fsmonitor', 'false'],
        ['core.fsmonitor', 'true'],
        ['alias.anything', 'status --short'],
        ['submodule.anything.update', 'rebase'],
        ['user.name', 'Someone'],
        ['remote.origin.url', 'https://example.com/repo.git']
    ])('does not flag %s = %s', async (settingName, settingValue) => {
        repository.git('config', settingName, settingValue)

        await expect(programs()).resolves.toEqual([])
    })

    it('flags a setting pulled in from a working tree file by include.path', async () => {
        repository.writeFile('included.config', '[core]\n\tfsmonitor = ./watch.sh\n')
        repository.git('config', 'include.path', '../included.config')

        await expect(programs()).resolves.toEqual([
            { kind: 'setting', name: 'core.fsmonitor', value: './watch.sh' }
        ])
    })

    it('flags hooks that are not samples', async () => {
        repository.writeFile('.git/hooks/post-index-change', '#!/bin/sh\n')
        repository.writeFile('.git/hooks/pre-push.sample', '#!/bin/sh\n')

        await expect(programs()).resolves.toEqual([{ kind: 'hook', name: 'post-index-change' }])
    })

    it('does not flag settings outside the repository', async () => {
        const previousGlobalConfig = process.env['GIT_CONFIG_GLOBAL']
        const globalConfig = join(repository.path, '.git', 'test-global-config')
        repository.writeFile('.git/test-global-config', '[core]\n\teditor = vim\n')
        process.env['GIT_CONFIG_GLOBAL'] = globalConfig
        try {
            await expect(programs()).resolves.toEqual([])
        } finally {
            process.env['GIT_CONFIG_GLOBAL'] = previousGlobalConfig
        }
    })

    it('runs none of the programs it finds, which git status would run', async () => {
        const markerPath = join(repository.path, 'program-ran.txt').replaceAll('\\', '/')
        const script = `#!/bin/sh\necho ran > "${markerPath}"\n`
        repository.writeExecutable('.git/watch.sh', script)
        repository.writeExecutable('.git/hooks/post-index-change', script)
        repository.git(
            'config',
            'core.fsmonitor',
            join(repository.path, '.git', 'watch.sh').replaceAll('\\', '/')
        )

        const foundPrograms = await programs()
        expect(foundPrograms).toHaveLength(2)
        expect(existsSync(markerPath)).toBe(false)

        repository.git('status')
        expect(existsSync(markerPath)).toBe(true)
    })
})
