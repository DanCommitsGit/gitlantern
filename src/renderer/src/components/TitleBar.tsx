import type { ReactNode } from 'react'
import { SettingsDialog } from '../settings/SettingsDialog'

export function TitleBar({ children }: { children?: ReactNode }): React.JSX.Element {
  return (
    <header className="title-bar">
      <span className="wordmark">gitlantern</span>
      {children}
      <span className="grow" />
      <SettingsDialog />
    </header>
  )
}
