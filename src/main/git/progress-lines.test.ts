import { describe, expect, it } from 'vitest'
import { createProgressLines, withoutOverwrittenText } from './progress-lines'

describe('withoutOverwrittenText', () => {
    it('keeps the last text of a redrawn line', () => {
        const output = 'Cloning\r\nReceiving:  10%\rReceiving:  20%\rerror: it failed\nfatal: early EOF'

        expect(withoutOverwrittenText(output)).toBe('Cloning\nerror: it failed\nfatal: early EOF')
    })

    it('keeps a line that ends in a carriage return', () => {
        expect(withoutOverwrittenText('Receiving:  10%\rReceiving:  20%\r')).toBe('Receiving:  20%')
    })
})

describe('createProgressLines', () => {
    function collect(): { lines: string[]; push(chunk: string): void } {
        const lines: string[] = []
        return { lines, push: createProgressLines((line) => lines.push(line)) }
    }

    it('reports the newest finished line of a chunk', () => {
        const { lines, push } = collect()

        push('Receiving objects:  10%\rReceiving objects:  20%\r')

        expect(lines).toEqual(['Receiving objects:  20%'])
    })

    it('holds back a line until its end arrives', () => {
        const { lines, push } = collect()

        push('Receiving obj')
        push('ects:  30%\r')

        expect(lines).toEqual(['Receiving objects:  30%'])
    })

    it('ignores blank lines and splits Windows line endings', () => {
        const { lines, push } = collect()

        push('\r\n\r\nremote: Counting objects\r\n')

        expect(lines).toEqual(['remote: Counting objects'])
    })

    it('reports nothing for a chunk with no finished line', () => {
        const { lines, push } = collect()

        push('Receiving')

        expect(lines).toEqual([])
    })
})
