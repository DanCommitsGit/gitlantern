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
  }
} as const satisfies Record<SettingKey, SettingText>
