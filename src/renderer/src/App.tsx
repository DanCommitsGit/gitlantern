import { Tooltip } from '@base-ui/react/tooltip'
import { useCallback, useEffect, useState } from 'react'
import type { CommandRecord } from '../../shared/command-record'
import type { GitCheck, OpenedRepository, OpenResult } from '../../shared/gitlantern-api'
import { errorMessage } from './error-message'
import { GitProblemScreen } from './components/GitProblemScreen'
import { NoticeBanner } from './components/NoticeBanner'
import { RepositoryWindow } from './components/RepositoryWindow'
import { TitleBar } from './components/TitleBar'
import { TrustDialog } from './components/TrustDialog'
import { WelcomeScreen } from './components/WelcomeScreen'

type NeedsTrust = Extract<OpenResult, { kind: 'needs-trust' }>
type OpenProblem = Extract<OpenResult, { kind: 'not-a-repository' | 'failed' }>

function App(): React.JSX.Element {
  const [gitCheck, setGitCheck] = useState<GitCheck | null>(null)
  const [repository, setRepository] = useState<OpenedRepository | null>(null)
  const [trustRequest, setTrustRequest] = useState<NeedsTrust | null>(null)
  const [openProblem, setOpenProblem] = useState<OpenProblem | null>(null)
  const [records, setRecords] = useState<CommandRecord[]>([])
  const [gitCheckFailure, setGitCheckFailure] = useState<string | null>(null)

  const addRecord = useCallback((record: CommandRecord) => {
    setRecords((previous) => [record, ...previous])
  }, [])

  const applyGitCheck = useCallback((request: Promise<GitCheck>) => {
    void request.then(
      (check) => {
        setGitCheck(check)
        setGitCheckFailure(null)
      },
      (error: unknown) => setGitCheckFailure(errorMessage(error))
    )
  }, [])

  useEffect(() => {
    applyGitCheck(window.api.checkGit())
  }, [applyGitCheck])

  function applyOpenResult(result: OpenResult): void {
    setTrustRequest(result.kind === 'needs-trust' ? result : null)
    setOpenProblem(result.kind === 'not-a-repository' || result.kind === 'failed' ? result : null)
    setRepository(result.kind === 'opened' ? result.repository : null)
  }

  function showOpenFailure(error: unknown): void {
    applyOpenResult({ kind: 'failed', message: errorMessage(error) })
  }

  async function open(request: Promise<OpenResult>): Promise<void> {
    try {
      applyOpenResult(await request)
    } catch (error) {
      showOpenFailure(error)
    }
  }

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
      <NoticeBanner />
      {gitCheckFailure !== null && (
        <div className="banner banner-danger rounded-none">{gitCheckFailure}</div>
      )}
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
