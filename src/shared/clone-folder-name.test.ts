import { describe, expect, it } from 'vitest'
import { cloneFolderName } from './clone-folder-name'

describe('cloneFolderName', () => {
    it.each([
        ['https://github.com/you/repo.git', 'repo'],
        ['https://github.com/you/repo', 'repo'],
        ['https://github.com/you/repo.git/', 'repo'],
        ['git@github.com:you/repo.git', 'repo'],
        ['git@github.com:repo.git', 'repo'],
        ['ssh://git@host:2222/srv/repo.git', 'repo'],
        ['  https://github.com/you/repo.git  ', 'repo'],
        ['C:\\projects\\repo.git', 'repo'],
        ['/srv/git/repo', 'repo'],
        ['https://github.com/you/my.repo.git', 'my.repo'],
        ['https://github.com/you/repo/.git', 'repo'],
        ['host.xz:foo/.git', 'foo'],
        ['host.xz:foo/.git/', 'foo'],
        ['C:\\projects\\repo\\.git', 'repo'],
        ['ssh://git@host.xz:2222/.git', 'host.xz'],
        ['https://user:secret@host.xz', 'host.xz'],
        ['https://host.xz/you/repo .git', 'repo']
    ])('names a clone of %s %s', (url, name) => {
        expect(cloneFolderName(url)).toBe(name)
    })

    it.each(['', '   ', '.git', '..', 'https://host/you/..', 'https://host/a/b?c'])(
        'gives no name for %j',
        (url) => {
            expect(cloneFolderName(url)).toBeNull()
        }
    )
})
