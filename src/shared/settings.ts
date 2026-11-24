export const FILE_LIST_STYLES = ['two-lists', 'checkboxes'] as const

export type FileListStyle = (typeof FILE_LIST_STYLES)[number]

export const LOG_STYLES = ['graph', 'plain'] as const

export type LogStyle = (typeof LOG_STYLES)[number]

export const COMMIT_DETAIL_PLACES = ['under', 'right'] as const

export type CommitDetailPlace = (typeof COMMIT_DETAIL_PLACES)[number]

export const BRANCH_LIST_STYLES = ['one-list', 'grouped'] as const

export type BranchListStyle = (typeof BRANCH_LIST_STYLES)[number]

export const BRANCH_ORDERS = ['current-first', 'name', 'newest-commit'] as const

export type BranchOrder = (typeof BRANCH_ORDERS)[number]

export const DIFF_VIEW_MODES = ['unified', 'split', 'words'] as const

export type DiffViewMode = (typeof DIFF_VIEW_MODES)[number]

export const STARTUP_PLACES = ['last-repository', 'welcome'] as const

export type StartupPlace = (typeof STARTUP_PLACES)[number]

export interface Settings {
    startupPlace: StartupPlace
    commandCard: boolean
    diffViewMode: DiffViewMode
    fileList: FileListStyle
    logStyle: LogStyle
    commitDetailPlace: CommitDetailPlace
    branchList: BranchListStyle
    branchOrder: BranchOrder
    autoUpdate: boolean
}

export type SettingKey = keyof Settings

export const DEFAULT_SETTINGS: Settings = {
    startupPlace: 'last-repository',
    commandCard: false,
    diffViewMode: 'unified',
    fileList: 'two-lists',
    logStyle: 'graph',
    commitDetailPlace: 'under',
    branchList: 'one-list',
    branchOrder: 'current-first',
    autoUpdate: true
}
