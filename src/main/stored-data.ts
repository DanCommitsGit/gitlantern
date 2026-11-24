// Each repair returns the stored value, a cleaned copy of it, or undefined to use the default.
export type StoredDataRepairs<Data> = {
    [Key in keyof Data]: (value: unknown) => Data[Key] | undefined
}

export interface RepairedData<Data> {
    data: Data
    changed: boolean
}

// conf parses the whole file on every read, and real files are a few hundred bytes.
export const MAX_STORED_DATA_LENGTH = 1_000_000

export function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Parses a store's file and repairs each known key on its own, so one bad key doesn't cost the
 * others. Unknown keys are kept, since a newer version of the app may have written them.
 * Throws a SyntaxError for text that isn't JSON or is longer than MAX_STORED_DATA_LENGTH.
 */
export function repairStoredData<Data extends object>(
    text: string,
    defaults: Data,
    repairs: StoredDataRepairs<Data>
): RepairedData<Data> {
    if (text.length > MAX_STORED_DATA_LENGTH) throw new SyntaxError('The file is too large')
    const parsed: unknown = JSON.parse(text.replace(/^\uFEFF/, ''))
    const stored = isPlainObject(parsed) ? parsed : {}
    const keys = Object.keys(defaults) as (keyof Data & string)[]

    const repairedKeys = Object.fromEntries(
        keys.map((key) => {
            const repaired = Object.hasOwn(stored, key) ? repairs[key](stored[key]) : undefined
            return [key, repaired === undefined ? defaults[key] : repaired]
        })
    )
    const data = { ...stored, ...repairedKeys } as Data

    return { data, changed: JSON.stringify(data) !== JSON.stringify(parsed) }
}
