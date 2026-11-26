/** Sends every error nothing else in the window catches to the log file. */
export function reportErrors(): void {
    window.addEventListener('error', (event) => logError(event.error ?? event.message))
    window.addEventListener('unhandledrejection', (event) => logError(event.reason))
}

export function logError(error: unknown): void {
    const description = (error instanceof Error && error.stack) || String(error)
    // A rejection left unhandled here would be reported again, without end.
    window.api.logWindowError(description).catch(() => {})
}
