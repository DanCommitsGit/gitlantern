import { Tooltip } from '@base-ui/react/tooltip'
import type { ButtonHTMLAttributes } from 'react'
import { useSetCommandPreview, type CommandPreview } from '../command-preview'
import { useSettings } from '../settings/settings-context'

interface CommandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  preview: CommandPreview
}

export function CommandButton({
  preview,
  onClick,
  children,
  ...buttonProps
}: CommandButtonProps): React.JSX.Element {
  const setPreview = useSetCommandPreview()
  const { settings } = useSettings()

  const commandProps: ButtonHTMLAttributes<HTMLButtonElement> = {
    type: 'button',
    onMouseEnter: () => setPreview(preview),
    onMouseLeave: () => setPreview(null),
    onFocus: () => setPreview(preview),
    onBlur: () => setPreview(null),
    onClick: (event) => {
      setPreview(null)
      onClick?.(event)
    },
    ...buttonProps
  }

  if (!settings.commandCard) return <button {...commandProps}>{children}</button>

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<button {...commandProps} />}>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner side="bottom" sideOffset={6}>
          <Tooltip.Popup className="command-card">
            <span className="command-box">{preview.typedCommand}</span>
            {preview.ranCommand && (
              <span className="text-small">
                Runs <span className="mono">{preview.ranCommand}</span>
              </span>
            )}
            <span className="card-explanation">{preview.explanation}</span>
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
