import { AppName } from './AppName'

export function CrashScreen(): React.JSX.Element {
    return (
        <div className="window">
            <header className="title-bar">
                <AppName />
            </header>
            <div className="message-pane">
                <section className="panel message-card">
                    <h1 className="text-head">GitLantern ran into a problem</h1>
                    <div className="flex items-center gap-2">
                        <button
                            className="button button-primary"
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Reload
                        </button>
                        <button className="button" type="button" onClick={() => void window.api.showLogs()}>
                            Open logs
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}
