import { createContext, useContext } from 'react'
import { formatCommand, type GitAction } from '../../shared/git-actions'

export interface CommandPreview {
  typedCommand: string
  ranCommand?: string
  explanation: string
}

export function previewAction(action: GitAction, explanation: string): CommandPreview {
  return {
    typedCommand: formatCommand(action.typedArguments),
    ...(action.differsFromTyped ? { ranCommand: formatCommand(action.gitArguments) } : {}),
    explanation
  }
}

export const SetCommandPreviewContext = createContext<(preview: CommandPreview | null) => void>(
  () => {}
)

export function useSetCommandPreview(): (preview: CommandPreview | null) => void {
  return useContext(SetCommandPreviewContext)
}
