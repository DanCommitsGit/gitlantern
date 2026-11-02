import type { CommandPreview } from '../command-preview'

interface CommandStripProps {
  preview: CommandPreview | null
}

function PreviewLine({ preview }: { preview: CommandPreview }): React.JSX.Element {
  return (
    <>
      {preview.ranCommand && <span className="text-small">You&apos;d type</span>}
      <span className="command truncate grow">{preview.typedCommand}</span>
      {preview.ranCommand ? (
        <>
          <span className="text-small">Runs</span>
          <span className="mono text-hint">{preview.ranCommand}</span>
        </>
      ) : (
        <span className="text-hint">{preview.explanation}</span>
      )}
    </>
  )
}

export function CommandStrip({ preview }: CommandStripProps): React.JSX.Element {
  return (
    <footer className="command-strip">
      <div className="command-strip-line">
        <svg className="icon command-strip-prompt" viewBox="0 0 16 16" aria-hidden="true">
          <path d="m3 4 4 4-4 4M8.5 12H13" />
        </svg>
        {preview ? <PreviewLine preview={preview} /> : <span className="grow" />}
      </div>
    </footer>
  )
}
