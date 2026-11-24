import type { Commit } from '../../../shared/history-types'

export function RefLabels({ commit }: { commit: Commit }): React.JSX.Element {
    return (
        <>
            {commit.refs.map((ref) => (
                <span key={`${ref.kind} ${ref.name}`} className="ref-label" data-kind={ref.kind}>
                    <span className="truncate">{ref.name}</span>
                </span>
            ))}
        </>
    )
}
