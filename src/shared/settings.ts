export const FILE_LIST_STYLES = ['two-lists', 'checkboxes'] as const

export type FileListStyle = (typeof FILE_LIST_STYLES)[number]

export const LOG_STYLES = ['graph', 'plain'] as const

export type LogStyle = (typeof LOG_STYLES)[number]

export const COMMIT_DETAIL_PLACES = ['under', 'right'] as const

export type CommitDetailPlace = (typeof COMMIT_DETAIL_PLACES)[number]

export interface Settings {
  commandCard: boolean
  fileList: FileListStyle
  logStyle: LogStyle
  commitDetailPlace: CommitDetailPlace
  autoUpdate: boolean
}

export type SettingKey = keyof Settings

export const DEFAULT_SETTINGS: Settings = {
  commandCard: false,
  fileList: 'two-lists',
  logStyle: 'graph',
  commitDetailPlace: 'under',
  autoUpdate: true
}
