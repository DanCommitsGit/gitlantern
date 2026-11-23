import { fetchAction, pullAction, pushAction, type PublishTarget } from '../../shared/git-actions'
import { previewAction, type CommandPreview } from './command-preview'

export function fetchPreview(): CommandPreview {
    return previewAction(fetchAction(), 'Downloads new commits from every remote and changes no files')
}

// When the branch and its upstream have diverged, a dialog chooses the pull mode, so only the bare "git pull" is shown.
export function pullPreview(isDiverged: boolean): CommandPreview {
    return isDiverged
        ? {
              typedCommand: 'git pull',
              explanation: 'Brings the remote branch into this one, by merge or by rebase'
          }
        : previewAction(
              pullAction('fast-forward-only'),
              'Brings new commits from the remote into this branch'
          )
}

export function pushPreview(publishTarget: PublishTarget | null): CommandPreview {
    return previewAction(
        pushAction(publishTarget),
        publishTarget === null
            ? 'Uploads your new commits to the remote'
            : 'Uploads this branch to the remote and links them, so Pull and Push use it from now on'
    )
}
