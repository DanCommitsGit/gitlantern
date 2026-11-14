import {
  stageAllAction,
  stageFilesAction,
  unstageAllAction,
  unstageFilesAction
} from '../../shared/git-actions'
import type { FileChange } from '../../shared/repository-types'
import { previewAction, type CommandPreview } from './command-preview'

// A staged rename is unstaged by both its paths.
export function pathsOf(change: FileChange): string[] {
  return change.originalPath === undefined ? [change.path] : [change.path, change.originalPath]
}

export function stageFilePreview(path: string): CommandPreview {
  return previewAction(stageFilesAction([path]), 'Puts this file in the next commit')
}

export function stageRestOfFilePreview(path: string): CommandPreview {
  return previewAction(stageFilesAction([path]), 'Puts the rest of this file in the next commit')
}

export function unstageFilePreview(change: FileChange, hasCommits: boolean): CommandPreview {
  return previewAction(
    unstageFilesAction(pathsOf(change), hasCommits),
    'Takes this file out of the next commit and keeps it as it is'
  )
}

export function stageAllPreview(): CommandPreview {
  return previewAction(stageAllAction(), 'Stages every change')
}

export function unstageAllPreview(hasCommits: boolean): CommandPreview {
  return previewAction(
    unstageAllAction(hasCommits),
    'Takes everything out of the next commit and keeps your files as they are'
  )
}
