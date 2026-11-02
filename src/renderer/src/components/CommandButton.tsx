import type { ButtonHTMLAttributes } from 'react'
import { useSetCommandPreview, type CommandPreview } from '../command-preview'

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

  return (
    <button
      type="button"
      onMouseEnter={() => setPreview(preview)}
      onMouseLeave={() => setPreview(null)}
      onFocus={() => setPreview(preview)}
      onBlur={() => setPreview(null)}
      onClick={(event) => {
        setPreview(null)
        onClick?.(event)
      }}
      {...buttonProps}
    >
      {children}
    </button>
  )
}
