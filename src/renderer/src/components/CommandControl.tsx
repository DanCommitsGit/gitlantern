import { Tooltip } from '@base-ui/react/tooltip'
import { cloneElement, type HTMLAttributes, type MouseEvent, type ReactElement } from 'react'
import { useSetCommandPreview, type CommandPreview } from '../command-preview'
import { useSettings } from '../settings/settings-context'

interface CommandControlProps {
  preview: CommandPreview
  render: ReactElement<HTMLAttributes<HTMLElement>>
}

// Shows a control's command in the strip, and in a card when that setting is on.
export function CommandControl({ preview, render }: CommandControlProps): React.JSX.Element {
  const setPreview = useSetCommandPreview()
  const { settings } = useSettings()

  const control = cloneElement(render, {
    onMouseEnter: () => setPreview(preview),
    onMouseLeave: () => setPreview(null),
    onFocus: () => setPreview(preview),
    onBlur: () => setPreview(null),
    onClick: (event: MouseEvent<HTMLElement>) => {
      setPreview(null)
      render.props.onClick?.(event)
    }
  })

  if (!settings.commandCard) return control

  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={control} />
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
