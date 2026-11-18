import type { ReactNode } from 'react'
import type { Branch } from '../../../shared/repository-types'
import { GLOSSARY, type GlossaryEntry } from '../glossary'
import { Hint } from './Hint'

function TrackCount({
  entry,
  arrow,
  count
}: {
  entry: GlossaryEntry
  arrow: string
  count: number
}): React.JSX.Element {
  return (
    <Hint entry={entry}>
      <span className="font-mono text-small text-ink-2">
        <span aria-hidden="true">
          {arrow}
          {count}
        </span>
        <span className="sr-only">
          {count} {entry.term.toLowerCase()}
        </span>
      </span>
    </Hint>
  )
}

export function HeadLabel(): React.JSX.Element {
  return (
    <Hint entry={GLOSSARY.head}>
      <span className="ref-label" data-kind="head">
        HEAD
      </span>
    </Hint>
  )
}

export function RailRow({
  isIndented = false,
  children
}: {
  isIndented?: boolean
  children: ReactNode
}): React.JSX.Element {
  return (
    <div
      className={`flex min-h-7 items-center gap-2 py-0.5 pr-3 whitespace-nowrap ${isIndented ? 'pl-8.5' : 'pl-3'}`}
    >
      {children}
    </div>
  )
}

export function BranchRow({
  branch,
  label,
  isCurrent,
  isIndented
}: {
  branch: Branch
  label: string
  isCurrent: boolean
  isIndented?: boolean
}): React.JSX.Element {
  return (
    <RailRow isIndented={isIndented}>
      {isCurrent && <HeadLabel />}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {branch.ahead > 0 && <TrackCount entry={GLOSSARY.ahead} arrow="↑" count={branch.ahead} />}
      {branch.behind > 0 && <TrackCount entry={GLOSSARY.behind} arrow="↓" count={branch.behind} />}
    </RailRow>
  )
}
