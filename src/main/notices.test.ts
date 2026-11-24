import { describe, expect, it, vi } from 'vitest'
import { createNotices } from './notices'

describe('createNotices', () => {
    it('starts empty', () => {
        expect(createNotices(vi.fn()).list()).toEqual([])
    })

    it('reports the list when a notice is raised, once however often it is raised', () => {
        const onChange = vi.fn()
        const notices = createNotices(onChange)

        notices.raise('app-data-not-saved')
        notices.raise('app-data-not-saved')

        expect(notices.list()).toEqual(['app-data-not-saved'])
        expect(onChange).toHaveBeenCalledOnce()
        expect(onChange).toHaveBeenCalledWith(['app-data-not-saved'])
    })

    it('removes a dismissed notice, and a notice raised again shows again', () => {
        const onChange = vi.fn()
        const notices = createNotices(onChange)
        notices.raise('app-data-not-saved')

        notices.dismiss('app-data-not-saved')
        expect(notices.list()).toEqual([])
        expect(onChange).toHaveBeenLastCalledWith([])

        notices.raise('app-data-not-saved')
        expect(notices.list()).toEqual(['app-data-not-saved'])
    })

    it('ignores dismissing a notice that is not shown', () => {
        const onChange = vi.fn()

        createNotices(onChange).dismiss('app-data-not-saved')

        expect(onChange).not.toHaveBeenCalled()
    })
})
