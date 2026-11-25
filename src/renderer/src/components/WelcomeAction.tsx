interface WelcomeActionProps {
    title: string
    description: string
    command?: string
    onClick(): void
}

export function WelcomeAction({
    title,
    description,
    command,
    onClick
}: WelcomeActionProps): React.JSX.Element {
    return (
        <button
            className="panel flex cursor-pointer flex-col gap-1 p-4 text-left hover:bg-hover"
            type="button"
            onClick={onClick}
        >
            <span className="text-head">{title}</span>
            <span className="text-small text-ink-2">{description}</span>
            {command !== undefined && <span className="command">{command}</span>}
        </button>
    )
}
