import { GLOSSARY } from '../glossary'
import { Hint } from './Hint'

export function Rail({ branchName }: { branchName: string | null }): React.JSX.Element {
  return (
    <aside className="pane rail">
      <div className="group-label">Branches</div>
      <div className="list-row">
        <Hint entry={GLOSSARY.head}>
          <span className="head-ref">HEAD</span>
        </Hint>
        <span className="truncate grow">{branchName ?? 'Not on a branch'}</span>
      </div>
    </aside>
  )
}
