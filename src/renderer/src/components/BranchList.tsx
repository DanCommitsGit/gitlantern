import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { Branch } from '../../../shared/repository-types'
import { groupBranches, orderBranches, withCurrentBranch, type BranchGroup } from '../branch-list'
import { useSettings } from '../settings/settings-context'
import { BranchRow, HeadLabel, SidebarRow } from './BranchRow'

interface BranchListProps {
  branches: Branch[]
  currentBranchName: string | null
  initialCollapsedGroups: string[]
}

function GroupHeader({
  group,
  isCollapsed,
  onToggle
}: {
  group: BranchGroup
  isCollapsed: boolean
  onToggle(): void
}): React.JSX.Element {
  const Chevron = isCollapsed ? ChevronRight : ChevronDown
  return (
    <button
      className="flex min-h-7 w-full cursor-pointer items-center gap-1.5 px-3 text-left"
      type="button"
      aria-expanded={!isCollapsed}
      onClick={onToggle}
    >
      <Chevron className="size-4 flex-none" aria-hidden="true" />
      <span className="min-w-0 truncate">{group.name}</span>
    </button>
  )
}

export function BranchList({
  branches,
  currentBranchName,
  initialCollapsedGroups
}: BranchListProps): React.JSX.Element {
  const { branchList, branchOrder } = useSettings().settings
  const [collapsedGroups, setCollapsedGroups] = useState(initialCollapsedGroups)
  const orderedBranches = orderBranches(
    withCurrentBranch(branches, currentBranchName),
    currentBranchName,
    branchOrder
  )

  function toggleGroup(groupName: string): void {
    const nextCollapsedGroups = collapsedGroups.includes(groupName)
      ? collapsedGroups.filter((name) => name !== groupName)
      : [...collapsedGroups, groupName]
    setCollapsedGroups(nextCollapsedGroups)
    void window.api.saveCollapsedBranchGroups(nextCollapsedGroups)
  }

  const branchRow = (
    branch: Branch,
    label = branch.name,
    isIndented = false
  ): React.JSX.Element => (
    <BranchRow
      key={branch.name}
      branch={branch}
      label={label}
      isCurrent={branch.name === currentBranchName}
      isIndented={isIndented}
    />
  )

  const { ungrouped, groups } = groupBranches(orderedBranches)

  return (
    <>
      {currentBranchName === null && (
        <SidebarRow>
          <HeadLabel />
          <span className="min-w-0 flex-1 truncate">Not on a branch</span>
        </SidebarRow>
      )}
      {branchList === 'one-list'
        ? orderedBranches.map((branch) => branchRow(branch))
        : [
            ...ungrouped.map((branch) => branchRow(branch)),
            ...groups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.name)
              return (
                <div key={`group:${group.name}`}>
                  <GroupHeader
                    group={group}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleGroup(group.name)}
                  />
                  {group.branches
                    .filter(({ branch }) => !isCollapsed || branch.name === currentBranchName)
                    .map(({ branch, label }) => branchRow(branch, label, true))}
                </div>
              )
            })
          ]}
    </>
  )
}
