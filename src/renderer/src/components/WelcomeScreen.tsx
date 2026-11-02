import { useEffect, useState } from 'react'
import type { OpenResult, RecentRepository } from '../../../shared/gitlantern-api'

interface WelcomeScreenProps {
  gitVersion: string
  gitPath: string
  problem: Extract<OpenResult, { kind: 'not-a-repository' | 'failed' }> | null
  onOpenFolder(folder: string): void
  onCreateInFolder(folder: string): void
}

export function WelcomeScreen({
  gitVersion,
  gitPath,
  problem,
  onOpenFolder,
  onCreateInFolder
}: WelcomeScreenProps): React.JSX.Element {
  const [recentRepositories, setRecentRepositories] = useState<RecentRepository[]>([])

  useEffect(() => {
    void window.api.recentRepositories().then(setRecentRepositories)
  }, [])

  async function chooseFolderThen(onChosen: (folder: string) => void): Promise<void> {
    const folder = await window.api.chooseFolder()
    if (folder !== null) onChosen(folder)
  }

  return (
    <div className="start-screen">
      <div className="start-content">
        <div className="column-layout" style={{ gap: 4 }}>
          <h1 className="start-wordmark">gitlantern</h1>
          <p className="start-tagline">Git, with the commands in plain sight.</p>
        </div>

        {problem?.kind === 'not-a-repository' && (
          <section className="panel message-card" style={{ maxWidth: 'none' }}>
            <h2 className="text-head">This folder isn&apos;t a git repository</h2>
            <p className="mono text-small">{problem.folder}</p>
            <div className="output">{problem.message}</div>
            <div className="row-layout">
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
        {problem?.kind === 'failed' && (
          <div className="banner banner-danger">{problem.message}</div>
        )}

        <div className="start-actions">
          <button
            className="panel start-action"
            type="button"
            onClick={() => void chooseFolderThen(onOpenFolder)}
          >
            <span className="text-head">Open</span>
            <span className="text-small">A repository on this computer</span>
          </button>
          <button
            className="panel start-action"
            type="button"
            onClick={() => void chooseFolderThen(onCreateInFolder)}
          >
            <span className="text-head">Create</span>
            <span className="text-small">Start a new one in a folder</span>
            <span className="command">git init</span>
          </button>
        </div>

        {recentRepositories.length > 0 && (
          <section className="column-layout" style={{ gap: 4 }}>
            <h2 className="text-label">Recent</h2>
            <ul className="panel">
              {recentRepositories.map((repository) => (
                <li key={repository.path}>
                  <button
                    className="recent-row"
                    type="button"
                    onClick={() => onOpenFolder(repository.path)}
                  >
                    <span className="recent-name">{repository.name}</span>
                    <span className="mono text-small truncate">{repository.path}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-hint">
          Using git {gitVersion} from {gitPath}
        </p>
      </div>
    </div>
  )
}
