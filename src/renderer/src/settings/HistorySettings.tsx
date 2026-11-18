import { ChoiceSetting } from './ChoiceSetting'

export function HistorySettings(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <ChoiceSetting settingKey="logStyle" />
      <ChoiceSetting settingKey="commitDetailPlace" />
    </div>
  )
}
