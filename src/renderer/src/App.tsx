import { Tooltip } from '@base-ui/react/tooltip'
import { useCallback, useEffect, useState } from 'react'
import type { CommandRecord } from '../../shared/command-record'
import type { GitCheck, OpenedRepository, OpenResult } from '../../shared/gitlantern-api'
import { GitProblemScreen } from './components/GitProblemScreen'
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

  const addRecord = useCallback((record: CommandRecord) => {
    setRecords((previous) => [record, ...previous])
  }, [])

  useEffect(() => {
    void window.api.checkGit().then(setGitCheck)
  }, [])

  function applyOpenResult(result: OpenResult): void {
    setTrustRequest(result.kind === 'needs-trust' ? result : null)
    setOpenProblem(result.kind === 'not-a-repository' || result.kind === 'failed' ? result : null)
    setRepository(result.kind === 'opened' ? result.repository : null)
  }

  async function createInFolder(folder: string): Promise<void> {
    const { result, record } = await window.api.createRepository(folder)
    if (record !== null) addRecord(record)
    applyOpenResult(result)
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
      {gitCheck?.state === 'ok' && (
        <WelcomeScreen
          gitVersion={gitCheck.version}
          gitPath={gitCheck.path}
          problem={openProblem}
          onOpenFolder={(folder) => void window.api.openRepository(folder).then(applyOpenResult)}
          onCreateInFolder={(folder) => void createInFolder(folder)}
        />
      )}
      {gitCheck !== null && gitCheck.state !== 'ok' && (
        <GitProblemScreen
          check={gitCheck}
          onCheckAgain={() => void window.api.checkGit().then(setGitCheck)}
          onChooseLocation={() => void window.api.chooseGitLocation().then(setGitCheck)}
        />
      )}
      {trustRequest !== null && (
        <TrustDialog
          path={trustRequest.path}
          programs={trustRequest.programs}
          onTrust={() => void window.api.trustPendingRepository().then(applyOpenResult)}
          onCancel={() => setTrustRequest(null)}
        />
      )}
    </div>
  )
}

export default App
