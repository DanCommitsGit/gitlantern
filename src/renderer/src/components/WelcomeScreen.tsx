import { useEffect, useState } from 'react'
import type { CommandRecord } from '../../../shared/command-record'
import type { OpenResult, RecentRepository } from '../../../shared/gitlantern-api'
import { CloneDialog } from './CloneDialog'
import { WelcomeAction } from './WelcomeAction'
import { Wordmark } from './Wordmark'

interface WelcomeScreenProps {
    gitVersion: string
    gitPath: string
    problem: Extract<OpenResult, { kind: 'not-a-repository' | 'failed' }> | null
    onOpenFolder(folder: string): void
    onCreateInFolder(folder: string): void
    onCloned(result: OpenResult, record: CommandRecord): void
    onFailure(error: unknown): void
}

export function WelcomeScreen({
    gitVersion,
    gitPath,
    problem,
    onOpenFolder,
    onCreateInFolder,
    onCloned,
    onFailure
}: WelcomeScreenProps): React.JSX.Element {
    const [recentRepositories, setRecentRepositories] = useState<RecentRepository[]>([])
    const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)

    useEffect(() => {
        void window.api.recentRepositories().then(setRecentRepositories, (error: unknown) => {
            console.error('Could not read the recent repositories', error)
        })
    }, [])

    async function chooseFolderThen(onChosen: (folder: string) => void): Promise<void> {
        try {
            const folder = await window.api.chooseFolder()
            if (folder !== null) onChosen(folder)
        } catch (error) {
            onFailure(error)
        }
    }

    return (
        <div className="flex flex-1 overflow-auto bg-sunken">
            <div className="m-auto flex w-160 max-w-[calc(100%-48px)] flex-col gap-6 py-6">
                <div className="flex flex-col gap-1">
                    <h1 className="font-mono text-display">
                        <Wordmark />
                    </h1>
                    <p className="text-ink-2">Git, with the commands in plain sight.</p>
                </div>

                {problem?.kind === 'not-a-repository' && (
                    <section className="panel message-card max-w-none">
                        <h2 className="text-head">This folder isn&apos;t a git repository</h2>
                        <p className="font-mono text-small text-ink-2">{problem.folder}</p>
                        <div className="output">{problem.message}</div>
                        <div className="flex items-center gap-2">
                            <button
                                className="button button-primary"
                                type="button"
                                onClick={() => onCreateInFolder(problem.folder)}
                            >
                                Create one here
                            </button>
                            <button
                                className="button"
                                type="button"
                                onClick={() => void chooseFolderThen(onOpenFolder)}
                            >
                                Choose another folder
                            </button>
                        </div>
                        <span className="command">git init</span>
                    </section>
                )}
                {problem?.kind === 'failed' && <div className="banner banner-danger">{problem.message}</div>}

                <div className="grid grid-cols-3 gap-3">
                    <WelcomeAction
                        title="Open"
                        description="A repository on this computer"
                        onClick={() => void chooseFolderThen(onOpenFolder)}
                    />
                    <WelcomeAction
                        title="Create"
                        description="Start a new one in a folder"
                        command="git init"
                        onClick={() => void chooseFolderThen(onCreateInFolder)}
                    />
                    <WelcomeAction
                        title="Clone"
                        description="A repository from a URL"
                        command="git clone"
                        onClick={() => setIsCloneDialogOpen(true)}
                    />
                </div>

                {recentRepositories.length > 0 && (
                    <section className="flex flex-col gap-1">
                        <h2 className="text-label text-ink-2">Recent</h2>
                        <ul className="panel">
                            {recentRepositories.map((repository) => (
                                <li key={repository.path}>
                                    <button
                                        className="flex min-h-7 w-full cursor-pointer items-center gap-2 px-3 py-0.5 text-left hover:bg-hover focus-visible:-outline-offset-2"
                                        type="button"
                                        onClick={() => onOpenFolder(repository.path)}
                                    >
                                        <span className="flex-none font-semibold">{repository.name}</span>
                                        <span className="min-w-0 truncate font-mono text-small text-ink-2">
                                            {repository.path}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <p className="text-small text-ink-3">
                    Using git {gitVersion} from {gitPath}
                </p>
            </div>
            {isCloneDialogOpen && (
                <CloneDialog
                    onCloned={(result, record) => {
                        setIsCloneDialogOpen(false)
                        onCloned(result, record)
                    }}
                    onClose={() => setIsCloneDialogOpen(false)}
                />
            )}
        </div>
    )
}
