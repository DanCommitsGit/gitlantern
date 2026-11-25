import { AlertDialog } from '@base-ui/react/alert-dialog'
import { useEffect, useState, type FormEvent } from 'react'
import { cloneDestination } from '../../../shared/clone-destination'
import type { CommandRecord } from '../../../shared/command-record'
import { cloneAction, formatCommand } from '../../../shared/git-actions'
import type { OpenResult } from '../../../shared/gitlantern-api'
import { errorMessage } from '../error-message'
import { DimWindowControls } from './DimWindowControls'

interface CloneDialogProps {
    onCloned(result: OpenResult, record: CommandRecord): void
    onClose(): void
}

export function CloneDialog({ onCloned, onClose }: CloneDialogProps): React.JSX.Element {
    const [url, setUrl] = useState('')
    const [parentFolder, setParentFolder] = useState<string | null>(null)
    const [isCloning, setIsCloning] = useState(false)
    const [progress, setProgress] = useState('')
    const [failure, setFailure] = useState<string | null>(null)

    useEffect(() => window.api.onCloneProgress(setProgress), [])

    const trimmedUrl = url.trim()
    const separator = window.api.platform === 'win32' ? '\\' : '/'
    const destination = parentFolder === null ? null : cloneDestination(trimmedUrl, parentFolder, separator)

    async function chooseParentFolder(): Promise<void> {
        try {
            const folder = await window.api.chooseFolder()
            if (folder !== null) setParentFolder(folder)
        } catch (error) {
            setFailure(errorMessage(error))
        }
    }

    async function clone(event: FormEvent): Promise<void> {
        event.preventDefault()
        if (destination === null || parentFolder === null || isCloning) return

        setFailure(null)
        setProgress('')
        setIsCloning(true)
        try {
            const outcome = await window.api.cloneRepository(trimmedUrl, parentFolder)
            if (outcome.kind === 'cloned') {
                onCloned(outcome.result, outcome.record)
                return
            }
            setFailure(outcome.message)
        } catch (error) {
            setFailure(errorMessage(error))
        }
        setIsCloning(false)
    }

    function close(): void {
        if (!isCloning) onClose()
    }

    return (
        <AlertDialog.Root open onOpenChange={(open) => !open && close()}>
            <AlertDialog.Portal>
                <DimWindowControls />
                <AlertDialog.Backdrop className="dialog-backdrop" />
                <AlertDialog.Popup className="dialog">
                    <form className="contents" onSubmit={(event) => void clone(event)}>
                        <AlertDialog.Title className="text-title">Clone a repository</AlertDialog.Title>
                        <div className="flex flex-col gap-1">
                            <label className="text-label text-ink-2" htmlFor="clone-url">
                                URL
                            </label>
                            <input
                                className="input"
                                id="clone-url"
                                value={url}
                                disabled={isCloning}
                                spellCheck={false}
                                onChange={(event) => setUrl(event.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-label text-ink-2" htmlFor="clone-parent-folder">
                                Clone into
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    className="input min-w-0 flex-1"
                                    id="clone-parent-folder"
                                    value={parentFolder ?? ''}
                                    placeholder="Choose a folder"
                                    readOnly
                                />
                                <button
                                    className="button flex-none"
                                    type="button"
                                    disabled={isCloning}
                                    onClick={() => void chooseParentFolder()}
                                >
                                    Choose
                                </button>
                            </div>
                            {destination !== null && (
                                <p className="font-mono text-small break-all text-ink-2">{destination}</p>
                            )}
                        </div>
                        <span className="command-box">
                            {destination === null
                                ? 'git clone'
                                : formatCommand(cloneAction(trimmedUrl, destination).typedArguments)}
                        </span>
                        {isCloning && progress !== '' && (
                            <p className="font-mono text-small text-ink-2" role="status">
                                {progress}
                            </p>
                        )}
                        {failure !== null && (
                            <div className="output" role="alert">
                                {failure}
                            </div>
                        )}
                        <div className="flex items-center justify-end gap-2">
                            <button className="button" type="button" disabled={isCloning} onClick={close}>
                                Cancel
                            </button>
                            <button
                                className="button button-primary"
                                type="submit"
                                disabled={destination === null || isCloning}
                            >
                                {isCloning ? 'Cloning…' : 'Clone'}
                            </button>
                        </div>
                    </form>
                </AlertDialog.Popup>
            </AlertDialog.Portal>
        </AlertDialog.Root>
    )
}
