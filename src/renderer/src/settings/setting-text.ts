import type { SettingKey } from '../../../shared/settings'

export interface SettingText {
  label: string
  description: string
}

export const SETTING_TEXT = {
  commandCard: {
    label: 'Command card at each button',
    description: 'Shows the command and what it does when you point at a button.'
  }
} as const satisfies Record<SettingKey, SettingText>
