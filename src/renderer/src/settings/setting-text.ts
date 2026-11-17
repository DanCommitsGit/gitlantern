import type { SettingKey } from '../../../shared/settings'

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
  autoUpdate: {
    label: 'Update automatically',
    description: 'Downloads new versions and installs them when you quit.'
  }
} as const satisfies Record<SettingKey, SettingText>
