import type { ButtonHTMLAttributes } from 'react'
import type { CommandPreview } from '../command-preview'
import { CommandControl } from './CommandControl'

interface CommandButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  preview: CommandPreview
}

export function CommandButton({
  preview,
  children,
  ...buttonProps
}: CommandButtonProps): React.JSX.Element {
  return (
    <CommandControl
      preview={preview}
      render={
        <button type="button" {...buttonProps}>
          {children}
        </button>
      }
    />
  )
}
