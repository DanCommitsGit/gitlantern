import { GLOSSARY } from '../glossary'
import { Hint } from './Hint'

export function Rail({ branchName }: { branchName: string | null }): React.JSX.Element {
  return (
    <aside className="pane w-57.5 flex-none bg-sunken">
      <div className="px-3 pt-3 pb-1 text-label text-ink-2">Branches</div>
      <div className="flex min-h-7 items-center gap-2 px-3 py-0.5 whitespace-nowrap">
        <Hint entry={GLOSSARY.head}>
          <span className="inline-flex min-h-4.5 items-center rounded-sm bg-lamp-fill px-1.5 font-mono text-small leading-[1.3] font-medium text-lamp-on">
            HEAD
          </span>
        </Hint>
        <span className="min-w-0 flex-1 truncate">{branchName ?? 'Not on a branch'}</span>
      </div>
    </aside>
  )
}
