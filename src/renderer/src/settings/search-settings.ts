import Fuse from 'fuse.js'
import { SETTING_TEXT } from './setting-text'
import { SETTINGS_SECTIONS, type SettingsSection } from './settings-sections'

const searchableSections = SETTINGS_SECTIONS.map((section: SettingsSection) => ({
  section,
  name: section.name,
  settings: section.settings.map((key) => SETTING_TEXT[key])
}))

const sectionSearch = new Fuse(searchableSections, {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'settings.label', weight: 2 },
    { name: 'settings.description', weight: 1 }
  ],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2
})

/** Sections matching the query, in their usual order. */
export function searchSettingsSections(query: string): readonly SettingsSection[] {
  if (query.trim() === '') return SETTINGS_SECTIONS
  const matches = new Set(sectionSearch.search(query.trim()).map((result) => result.item.section))
  return SETTINGS_SECTIONS.filter((section) => matches.has(section))
}
