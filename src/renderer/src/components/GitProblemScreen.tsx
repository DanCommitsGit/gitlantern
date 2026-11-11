import type { GitCheck } from '../../../shared/gitlantern-api'

const INSTALL_COMMANDS: Record<string, string> = {
  win32: 'winget install --id Git.Git -e --source winget',
  darwin: 'brew install git',
  linux: 'sudo apt install git'
}

const UPGRADE_COMMANDS: Record<string, string> = {
  win32: 'winget upgrade --id Git.Git -e --source winget',
  darwin: 'brew upgrade git',
  linux: 'sudo apt install --only-upgrade git'
}

interface GitProblemScreenProps {
  check: Exclude<GitCheck, { state: 'ok' }>
  onCheckAgain(): void
  onChooseLocation(): void
}

export function GitProblemScreen({
  check,
  onCheckAgain,
  onChooseLocation
}: GitProblemScreenProps): React.JSX.Element {
  const isMissing = check.state === 'missing'
  const command = (isMissing ? INSTALL_COMMANDS : UPGRADE_COMMANDS)[window.api.platform]

  return (
    <div className="message-pane">
      <section className="panel message-card">
        <h1 className="text-head">{isMissing ? "Git isn't installed" : 'This git is too old'}</h1>
        <p>
          {isMissing
            ? "gitlantern runs the git on your computer, and it couldn't find one."
            : `You have git ${check.version}. gitlantern needs 2.38 or newer.`}
        </p>
        {command && <div className="command-box">{command}</div>}
        <div className="row-layout">
          {command && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => void window.api.copyText(command)}
            >
              Copy command
            </button>
          )}
          {isMissing && (
            <a
              className="button"
              href="https://git-scm.com/downloads"
              target="_blank"
              rel="noreferrer"
            >
              Download from git-scm.com
            </a>
          )}
          <button className="button" type="button" onClick={onCheckAgain}>
            Check again
          </button>
        </div>
        {isMissing && (
          <button
            className="button button-quiet"
            type="button"
            style={{ alignSelf: 'flex-start', paddingLeft: 0 }}
            onClick={onChooseLocation}
          >
            Already installed? Choose its location
          </button>
        )}
      </section>
    </div>
  )
}
