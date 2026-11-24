import type { Branch } from '../../../shared/repository-types'
import { BranchList } from './BranchList'

interface RepositorySidebarProps {
    branches: Branch[]
    currentBranchName: string | null
    initialCollapsedBranchGroups: string[]
}

export function RepositorySidebar({
    branches,
    currentBranchName,
    initialCollapsedBranchGroups
}: RepositorySidebarProps): React.JSX.Element {
    return (
        <aside className="pane w-57.5 flex-none bg-sunken">
            <div className="list-scroll">
                <div className="px-3 pt-3 pb-1 text-label text-ink-2">Branches</div>
                <BranchList
                    branches={branches}
                    currentBranchName={currentBranchName}
                    initialCollapsedGroups={initialCollapsedBranchGroups}
                />
            </div>
        </aside>
    )
}
