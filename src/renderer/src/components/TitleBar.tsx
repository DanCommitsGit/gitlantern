import type { ReactNode } from 'react'

export function TitleBar({ children }: { children?: ReactNode }): React.JSX.Element {
  return (
    <header className="title-bar">
      <span className="wordmark">gitlantern</span>
      {children}
    </header>
  )
}
