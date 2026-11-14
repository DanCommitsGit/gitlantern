import type { ComponentType } from 'react'
import { HintsAndCommandsSettings } from './HintsAndCommandsSettings'

export interface SettingsSection {
  id: string
  name: string
  Panel?: ComponentType
}

export const SETTINGS_SECTIONS = [
  { id: 'hints-and-commands', name: 'Hints and commands', Panel: HintsAndCommandsSettings },
  { id: 'diffs', name: 'Diffs' }
] as const satisfies readonly SettingsSection[]
