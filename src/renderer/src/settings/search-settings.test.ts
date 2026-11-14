import { describe, expect, it } from 'vitest'
import { searchSettingsSections } from './search-settings'

function sectionNames(query: string): string[] {
  return searchSettingsSections(query).map((section) => section.name)
}

describe('searchSettingsSections', () => {
  it('lists every section for an empty query', () => {
    expect(sectionNames('  ')).toEqual(['Hints and commands', 'Changes'])
  })

  it('matches a choice of a setting', () => {
    expect(sectionNames('checkboxes')).toEqual(['Changes'])
  })

  it('matches a section name', () => {
    expect(sectionNames('hints')).toEqual(['Hints and commands'])
  })

  it('matches a setting label despite a typo', () => {
    expect(sectionNames('comand card')).toEqual(['Hints and commands'])
  })

  it('matches words late in a setting description', () => {
    expect(sectionNames('point at')).toEqual(['Hints and commands'])
  })

  it('matches nothing for unrelated text', () => {
    expect(sectionNames('zqxv')).toEqual([])
  })
})
