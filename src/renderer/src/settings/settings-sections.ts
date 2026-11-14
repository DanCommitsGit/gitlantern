import type { ComponentType } from 'react'
import type { SettingKey } from '../../../shared/settings'
import { ChangesSettings } from './ChangesSettings'
import { HintsAndCommandsSettings } from './HintsAndCommandsSettings'

export interface SettingsSection {
  id: string
  name: string
  settings: readonly SettingKey[]
  Panel?: ComponentType
}

export const SETTINGS_SECTIONS = [
  {
    id: 'hints-and-commands',
    name: 'Hints and commands',
    settings: ['commandCard'],
    Panel: HintsAndCommandsSettings
  },
  { id: 'changes', name: 'Changes', settings: ['fileList'], Panel: ChangesSettings }
] as const satisfies readonly SettingsSection[]
