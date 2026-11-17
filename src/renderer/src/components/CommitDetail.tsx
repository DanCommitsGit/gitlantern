import type { Commit } from '../../../shared/history-types'
import type { CommitDetailPlace } from '../../../shared/settings'
import { pathLabelOf } from '../changed-files'
import { useCommitFiles } from '../use-commit-files'
import { DiffMessage } from './DiffMessage'
import { DiffView } from './DiffView'
import { CommitSummary } from './CommitSummary'
import { StatusBadge } from './StatusBadge'

interface CommitDetailProps {
  commit: Commit
  place: CommitDetailPlace
}

export function CommitDetail({ commit, place }: CommitDetailProps): React.JSX.Element {
  const commitFiles = useCommitFiles(commit.hash)
  const { files, selectedFile } = commitFiles

  const summaryAndFiles = (
    <>
      <CommitSummary commit={commit} />
      {commitFiles.errorMessage !== null && (
        <div className="banner banner-danger flex-none rounded-none">
          {commitFiles.errorMessage}
        </div>
      )}
      <ul
        className={
          place === 'under'
            ? 'list-scroll'
            : 'max-h-36 flex-none overflow-auto border-b border-line'
        }
      >
        {files?.map((file) => (
          <li
            key={file.path}
            className="list-row pr-0"
            data-selected={file.path === selectedFile?.path}
          >
            <button
              className="list-row-select"
              type="button"
              title={pathLabelOf(file)}
              aria-current={file.path === selectedFile?.path}
              onClick={() => commitFiles.selectFile(file.path)}
            >
              <StatusBadge status={file.status} />
              <span className="min-w-0 flex-1 truncate">{file.path}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  )

  const diffView = (
    <DiffView
      title={selectedFile && pathLabelOf(selectedFile)}
      diff={commitFiles.diff}
      onShowLarge={commitFiles.showLargeDiff}
    >
      {files?.length === 0 && (
        <DiffMessage title="No files changed" message="This commit changes no files." />
      )}
    </DiffView>
  )

  return place === 'under' ? (
    <div className="flex min-h-0 flex-1 border-t border-line">
      <section className="pane w-80 flex-none">{summaryAndFiles}</section>
      {diffView}
    </div>
  ) : (
    <section className="pane min-w-0 flex-1">
      {summaryAndFiles}
      {diffView}
    </section>
  )
}
