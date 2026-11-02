export function Rail({ branchName }: { branchName: string | null }): React.JSX.Element {
  return (
    <aside className="pane rail">
      <div className="group-label">Branches</div>
      <div className="list-row">
        <span className="head-ref">HEAD</span>
        <span className="truncate grow">{branchName ?? 'Not on a branch'}</span>
      </div>
    </aside>
  )
}
