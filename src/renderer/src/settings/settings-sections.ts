import type { ComponentType } from 'react'
import { BranchesSettings } from './BranchesSettings'
import { ChangesSettings } from './ChangesSettings'
import { HistorySettings } from './HistorySettings'
import { HintsAndCommandsSettings } from './HintsAndCommandsSettings'
import type { SettingsPageKey } from './setting-text'
import { UpdatesSettings } from './UpdatesSettings'

export interface SettingsSection {
  id: string
  name: string
  settings: readonly SettingsPageKey[]
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
  {
    id: 'branches',
    name: 'Branches',
    settings: ['branchList', 'branchOrder'],
    Panel: BranchesSettings
  },
  { id: 'updates', name: 'Updates', settings: ['autoUpdate'], Panel: UpdatesSettings }
] as const satisfies readonly SettingsSection[]
