import { Tooltip } from '@base-ui/react/tooltip'
import { useCallback, useEffect, useState } from 'react'
import type { CommandRecord } from '../../shared/command-record'
import type { GitCheck, OpenedRepository, OpenResult } from '../../shared/gitlantern-api'
import { errorMessage } from './error-message'
import { GitProblemScreen } from './components/GitProblemScreen'
import { NotificationBanner } from './components/NotificationBanner'
import { RepositoryWindow } from './components/RepositoryWindow'
import { TitleBar } from './components/TitleBar'
import { TrustDialog } from './components/TrustDialog'
import { WelcomeScreen } from './components/WelcomeScreen'
import { raiseNotification } from './notifications/raise-notification'

type NeedsTrust = Extract<OpenResult, { kind: 'needs-trust' }>
type OpenProblem = Extract<OpenResult, { kind: 'not-a-repository' | 'failed' }>

// Runs once per window load. In development Strict Mode runs the effect below twice, and the second run
// would show the welcome screen while the first is still opening the repository.
let hasStarted = false

function App(): React.JSX.Element {
    const [gitCheck, setGitCheck] = useState<GitCheck | null>(null)
    const [repository, setRepository] = useState<OpenedRepository | null>(null)
    const [trustRequest, setTrustRequest] = useState<NeedsTrust | null>(null)
    const [openProblem, setOpenProblem] = useState<OpenProblem | null>(null)
    const [records, setRecords] = useState<CommandRecord[]>([])

    const addRecord = useCallback((record: CommandRecord) => {
        setRecords((previous) => [record, ...previous])
    }, [])

    const applyGitCheck = useCallback((request: Promise<GitCheck>) => {
        void request.then(setGitCheck, (error: unknown) => raiseNotification('error', errorMessage(error)))
    }, [])

    const applyOpenResult = useCallback((result: OpenResult): void => {
        setTrustRequest(result.kind === 'needs-trust' ? result : null)
        setOpenProblem(result.kind === 'not-a-repository' || result.kind === 'failed' ? result : null)
        setRepository(result.kind === 'opened' ? result.repository : null)
    }, [])

    const showOpenFailure = useCallback(
        (error: unknown): void => applyOpenResult({ kind: 'failed', message: errorMessage(error) }),
        [applyOpenResult]
    )

    async function open(request: Promise<OpenResult>): Promise<void> {
        try {
            applyOpenResult(await request)
        } catch (error) {
            showOpenFailure(error)
        }
    }

    useEffect(() => {
        if (hasStarted) return
        hasStarted = true

        // The welcome screen waits for the startup repository, so it doesn't flash before it.
        async function start(): Promise<void> {
            try {
                const check = await window.api.checkGit()
                if (check.state === 'ok') {
                    try {
                        const startupResult = await window.api.openStartupRepository()
                        if (startupResult !== null) applyOpenResult(startupResult)
                    } catch (error) {
                        showOpenFailure(error)
                    }
                }
                setGitCheck(check)
            } catch (error) {
                raiseNotification('error', errorMessage(error))
            }
        }
        void start()
    }, [applyOpenResult, showOpenFailure])

    async function createInFolder(folder: string): Promise<void> {
        try {
            const { result, record } = await window.api.createRepository(folder)
            if (record !== null) addRecord(record)
            applyOpenResult(result)
        } catch (error) {
            showOpenFailure(error)
        }
    }

    function closeRepository(): void {
        void window.api.closeRepository()
        setRepository(null)
        setOpenProblem(null)
        setRecords([])
    }

    if (repository !== null) {
        return (
            <Tooltip.Provider>
                <RepositoryWindow
                    key={repository.path}
                    repository={repository}
                    records={records}
                    onRecord={addRecord}
                    onClose={closeRepository}
                />
            </Tooltip.Provider>
        )
    }

    return (
        <div className="window">
            <TitleBar />
            <NotificationBanner />
            {gitCheck?.state === 'ok' && (
                <WelcomeScreen
                    gitVersion={gitCheck.version}
                    gitPath={gitCheck.path}
                    problem={openProblem}
                    onOpenFolder={(folder) => void open(window.api.openRepository(folder))}
                    onCreateInFolder={(folder) => void createInFolder(folder)}
                    onFailure={showOpenFailure}
                />
            )}
            {gitCheck !== null && gitCheck.state !== 'ok' && (
                <GitProblemScreen
                    check={gitCheck}
                    onCheckAgain={() => applyGitCheck(window.api.checkGit())}
                    onChooseLocation={() => applyGitCheck(window.api.chooseGitLocation())}
                />
            )}
            {trustRequest !== null && (
                <TrustDialog
                    path={trustRequest.path}
                    programs={trustRequest.programs}
                    onTrust={() => void open(window.api.trustPendingRepository())}
                    onCancel={() => setTrustRequest(null)}
                />
            )}
        </div>
    )
}

export default App
