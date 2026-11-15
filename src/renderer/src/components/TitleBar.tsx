import type { ReactNode } from 'react'
import { SettingsDialog } from '../settings/SettingsDialog'

export function TitleBar({ children }: { children?: ReactNode }): React.JSX.Element {
  return (
    <header className="title-bar">
      <span className="font-mono font-semibold">gitlantern</span>
      {children}
      <span className="min-w-0 flex-1" />
      <SettingsDialog />
    </header>
  )
}
