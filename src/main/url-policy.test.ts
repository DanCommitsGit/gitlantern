import { describe, expect, it } from 'vitest'
import { isExternalLinkAllowed, isSameOrigin } from './url-policy'

describe('isExternalLinkAllowed', () => {
  it.each(['https://example.com/page', 'http://example.com'])('allows %s', (url) => {
    expect(isExternalLinkAllowed(url)).toBe(true)
  })

  it.each([
    'file:///C:/Windows/System32/calc.exe',
    'smb://attacker.example/share',
    'ms-calculator:',
    'javascript:alert(1)',
    'not a url',
    ''
  ])('rejects %j', (url) => {
    expect(isExternalLinkAllowed(url)).toBe(false)
  })
})

describe('isSameOrigin', () => {
  it('matches pages on the app origin', () => {
    expect(isSameOrigin('app://-/other.html', 'app://-')).toBe(true)
  })

  it('matches pages on the dev server', () => {
    expect(isSameOrigin('http://localhost:5173/a', 'http://localhost:5173')).toBe(true)
  })

  it.each([
    'https://example.com',
    'app://other/index.html',
    'file:///C:/Windows/win.ini',
    'not a url'
  ])('rejects %s on the app origin', (url) => {
    expect(isSameOrigin(url, 'app://-')).toBe(false)
  })

  it('rejects another port on the dev server', () => {
    expect(isSameOrigin('http://localhost:5174/', 'http://localhost:5173')).toBe(false)
  })
})
