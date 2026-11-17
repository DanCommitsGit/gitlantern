import type { ComponentType } from 'react'
import type { SettingKey } from '../../../shared/settings'
import { ChangesSettings } from './ChangesSettings'
import { HistorySettings } from './HistorySettings'
import { HintsAndCommandsSettings } from './HintsAndCommandsSettings'
import { UpdatesSettings } from './UpdatesSettings'

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
  { id: 'changes', name: 'Changes', settings: ['fileList'], Panel: ChangesSettings },
  {
    id: 'history',
    name: 'History',
    settings: ['logStyle', 'commitDetailPlace'],
    Panel: HistorySettings
  },
  { id: 'updates', name: 'Updates', settings: ['autoUpdate'], Panel: UpdatesSettings }
] as const satisfies readonly SettingsSection[]
