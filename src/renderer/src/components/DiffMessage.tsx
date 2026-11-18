export function DiffMessage({
  title,
  message,
  details,
  children
}: {
  title: string
  message: string
  details?: string
  children?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="message-pane">
      <section className="panel message-card">
        <h2 className="text-head">{title}</h2>
        <p className="text-small text-ink-2">{message}</p>
        {details && <div className="output">{details}</div>}
        {children}
      </section>
    </div>
  )
}
