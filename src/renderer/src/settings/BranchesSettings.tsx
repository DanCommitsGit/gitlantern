import { ChoiceSetting } from './ChoiceSetting'

export function BranchesSettings(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <ChoiceSetting settingKey="branchList" />
      <ChoiceSetting settingKey="branchOrder" />
    </div>
  )
}
