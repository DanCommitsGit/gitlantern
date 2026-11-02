import { useEffect, useState } from 'react'
import type { GitCheck, OpenedRepository, OpenResult } from '../../shared/gitlantern-api'
import { GitProblemScreen } from './components/GitProblemScreen'
import { RepositoryWindow } from './components/RepositoryWindow'
import { TitleBar } from './components/TitleBar'
import { WelcomeScreen } from './components/WelcomeScreen'

type OpenProblem = Extract<OpenResult, { kind: 'not-a-repository' | 'failed' }>

function App(): React.JSX.Element {
  const [gitCheck, setGitCheck] = useState<GitCheck | null>(null)
  const [repository, setRepository] = useState<OpenedRepository | null>(null)
  const [openProblem, setOpenProblem] = useState<OpenProblem | null>(null)

  useEffect(() => {
    void window.api.checkGit().then(setGitCheck)
  }, [])

  function applyOpenResult(result: OpenResult): void {
    setOpenProblem(result.kind === 'not-a-repository' || result.kind === 'failed' ? result : null)
    setRepository(result.kind === 'opened' ? result.repository : null)
  }

  async function createInFolder(folder: string): Promise<void> {
    const { result } = await window.api.createRepository(folder)
    applyOpenResult(result)
  }

  function closeRepository(): void {
    void window.api.closeRepository()
    setRepository(null)
    setOpenProblem(null)
  }

  if (repository !== null) {
    return (
      <RepositoryWindow key={repository.path} repository={repository} onClose={closeRepository} />
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
    </div>
  )
}

export default App
