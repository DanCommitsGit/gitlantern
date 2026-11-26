/** Sends every error nothing else in the window catches to the log file. */
export function reportErrors(): void {
    // React reports an error thrown while rendering as a window 'error' event.
    window.addEventListener('error', (event) => report(event.error ?? event.message))
    window.addEventListener('unhandledrejection', (event) => report(event.reason))
}

function report(error: unknown): void {
    const description = (error instanceof Error && error.stack) || String(error)
    // A rejection left unhandled here would be reported again, without end.
    window.api.logWindowError(description).catch(() => {})
}
