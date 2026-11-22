import type { SettingKey } from '../../../shared/settings'

/** The settings with an entry on the settings page. The diff view mode is changed on the diff itself. */
export type SettingsPageKey = Exclude<SettingKey, 'diffViewMode'>

export interface SettingText {
  label: string
  description?: string
  choices?: readonly { value: string; label: string }[]
}

export const SETTING_TEXT = {
  commandCard: {
    label: 'Command card at each button',
    description: 'Shows the command and what it does when you point at a button.'
  },
  fileList: {
    label: 'Changed files',
    choices: [
      { value: 'two-lists', label: 'Two lists, unstaged and staged' },
      { value: 'checkboxes', label: 'One list with checkboxes' }
    ]
  },
  logStyle: {
    label: 'Commit log',
    choices: [
      { value: 'graph', label: 'With the branch graph' },
      { value: 'plain', label: 'Without the graph' }
    ]
  },
  commitDetailPlace: {
    label: 'Selected commit',
    choices: [
      { value: 'under', label: 'Under the log' },
      { value: 'right', label: 'Right of the log' }
    ]
  },
  branchList: {
    label: 'Branch list',
    choices: [
      { value: 'one-list', label: 'One list' },
      { value: 'grouped', label: 'Grouped by the part before /' }
    ]
  },
  branchOrder: {
    label: 'Branch order',
    choices: [
      { value: 'current-first', label: 'Current branch first, then by name' },
      { value: 'name', label: 'By name' },
      { value: 'newest-commit', label: 'Newest commit first' }
    ]
  },
  autoUpdate: {
    label: 'Update automatically',
    description: 'Downloads new versions and installs them when you quit.'
  }
} as const satisfies Record<SettingsPageKey, SettingText>
