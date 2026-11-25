import {
    BRANCH_LIST_STYLES,
    BRANCH_ORDERS,
    COMMIT_DETAIL_PLACES,
    type BranchListStyle,
    type BranchOrder,
    DEFAULT_SETTINGS,
    DIFF_VIEW_MODES,
    FILE_LIST_STYLES,
    LOG_STYLES,
    STARTUP_PLACES,
    THEMES,
    type CommitDetailPlace,
    type DiffViewMode,
    type FileListStyle,
    type LogStyle,
    type SettingKey,
    type Settings,
    type StartupPlace,
    type Theme
} from '../shared/settings'

export interface SettingsStore {
    get<Key extends SettingKey>(key: Key): Settings[Key]
    set(key: SettingKey, value: Settings[SettingKey]): void
}

export const SETTING_CHECKS: { [Key in SettingKey]: (value: unknown) => value is Settings[Key] } = {
    theme: (value): value is Theme => THEMES.includes(value as Theme),
    startupPlace: (value): value is StartupPlace => STARTUP_PLACES.includes(value as StartupPlace),
    commandCard: (value): value is boolean => typeof value === 'boolean',
    diffViewMode: (value): value is DiffViewMode => DIFF_VIEW_MODES.includes(value as DiffViewMode),
    fileList: (value): value is FileListStyle => FILE_LIST_STYLES.includes(value as FileListStyle),
    logStyle: (value): value is LogStyle => LOG_STYLES.includes(value as LogStyle),
    commitDetailPlace: (value): value is CommitDetailPlace =>
        COMMIT_DETAIL_PLACES.includes(value as CommitDetailPlace),
    branchList: (value): value is BranchListStyle => BRANCH_LIST_STYLES.includes(value as BranchListStyle),
    branchOrder: (value): value is BranchOrder => BRANCH_ORDERS.includes(value as BranchOrder),
    autoUpdate: (value): value is boolean => typeof value === 'boolean'
}

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[]

export function readSettings(store: SettingsStore): Settings {
    return Object.fromEntries(SETTING_KEYS.map((key) => [key, store.get(key)])) as unknown as Settings
}

export function saveSetting(store: SettingsStore, key: unknown, value: unknown): Settings {
    if (typeof key !== 'string' || !Object.hasOwn(SETTING_CHECKS, key)) {
        throw new TypeError('Unknown setting')
    }
    const settingKey = key as SettingKey
    const check = SETTING_CHECKS[settingKey] as (candidate: unknown) => boolean
    if (!check(value)) throw new TypeError(`Invalid value for ${key}`)

    store.set(settingKey, value as Settings[SettingKey])
    return readSettings(store)
}
