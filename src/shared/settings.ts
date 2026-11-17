export const FILE_LIST_STYLES = ['two-lists', 'checkboxes'] as const

export type FileListStyle = (typeof FILE_LIST_STYLES)[number]

export interface Settings {
  commandCard: boolean
  fileList: FileListStyle
  autoUpdate: boolean
}

export type SettingKey = keyof Settings

export const DEFAULT_SETTINGS: Settings = {
  commandCard: false,
  fileList: 'two-lists',
  autoUpdate: true
}
