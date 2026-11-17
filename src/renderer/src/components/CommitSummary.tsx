import type { Commit } from '../../../shared/history-types'

export function CommitSummary({ commit }: { commit: Commit }): React.JSX.Element {
  return (
    <div className="flex max-h-40 flex-none flex-col gap-1.5 overflow-auto border-b border-line p-3">
      <h2 className="text-head">{commit.subject}</h2>
      {commit.body !== '' && (
        <p className="text-small whitespace-pre-wrap text-ink-2">{commit.body}</p>
      )}
      <p className="text-small wrap-anywhere text-ink-2">
        {commit.authorName} &lt;{commit.authorEmail}&gt;,{' '}
        {new Date(commit.authorDate).toLocaleString([], {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}
      </p>
      <p className="font-mono text-code break-all text-ink-3">{commit.hash}</p>
    </div>
  )
}
