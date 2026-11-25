import { describe, expect, it } from 'vitest'
import { cloneDestination } from './clone-destination'

describe('cloneDestination', () => {
    it.each([
        ['C:\\projects', '\\', 'C:\\projects\\repo'],
        ['C:\\', '\\', 'C:\\repo'],
        ['/home/you', '/', '/home/you/repo'],
        ['/', '/', '/repo']
    ])('puts a clone into %s', (parentFolder, separator, destination) => {
        expect(cloneDestination('https://github.com/you/repo.git', parentFolder, separator)).toBe(destination)
    })

    it('gives no path for a URL with no folder name', () => {
        expect(cloneDestination('..', '/home/you', '/')).toBeNull()
    })
})
