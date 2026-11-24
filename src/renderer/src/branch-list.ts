import type { Branch } from '../../shared/repository-types'
import type { BranchOrder } from '../../shared/settings'

export interface BranchGroup {
    name: string
    // Each branch with the group's name and its slash cut off.
    branches: { branch: Branch; label: string }[]
}

export interface GroupedBranches {
    ungrouped: Branch[]
    groups: BranchGroup[]
}

function byName(first: Branch, second: Branch): number {
    return first.name.localeCompare(second.name)
}

// A branch with no commits yet has no ref, so git lists it nowhere but in status.
export function withCurrentBranch(branches: Branch[], currentBranchName: string | null): Branch[] {
    if (currentBranchName === null || branches.some((branch) => branch.name === currentBranchName)) {
        return branches
    }
    return [...branches, { name: currentBranchName, ahead: 0, behind: 0, committedAt: 0 }]
}

export function orderBranches(
    branches: Branch[],
    currentBranchName: string | null,
    order: BranchOrder
): Branch[] {
    if (order === 'newest-commit') {
        return branches.toSorted(
            (first, second) => second.committedAt - first.committedAt || byName(first, second)
        )
    }
    const sorted = branches.toSorted(byName)
    if (order === 'name') return sorted
    return [
        ...sorted.filter((branch) => branch.name === currentBranchName),
        ...sorted.filter((branch) => branch.name !== currentBranchName)
    ]
}

// Branches without a slash come first, then one group per first part, each placed where its
// first branch falls in the order.
export function groupBranches(orderedBranches: Branch[]): GroupedBranches {
    const ungrouped: Branch[] = []
    const groupsByName = new Map<string, BranchGroup>()
    for (const branch of orderedBranches) {
        const slashIndex = branch.name.indexOf('/')
        if (slashIndex === -1) {
            ungrouped.push(branch)
            continue
        }
        const groupName = branch.name.slice(0, slashIndex)
        const group = groupsByName.get(groupName) ?? { name: groupName, branches: [] }
        group.branches.push({ branch, label: branch.name.slice(slashIndex + 1) })
        groupsByName.set(groupName, group)
    }
    return { ungrouped, groups: [...groupsByName.values()] }
}
