import { Component, type ReactNode } from 'react'
import { logError } from '../report-errors'
import { CrashScreen } from './CrashScreen'

interface ErrorBoundaryProps {
    children: ReactNode
}

/** Shows the crash screen in place of its children when one of them throws while rendering. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { hasFailed: boolean }> {
    state = { hasFailed: false }

    static getDerivedStateFromError(): { hasFailed: boolean } {
        return { hasFailed: true }
    }

    // An error caught here doesn't reach the window's 'error' event.
    componentDidCatch(error: unknown): void {
        logError(error)
    }

    render(): ReactNode {
        return this.state.hasFailed ? <CrashScreen /> : this.props.children
    }
}
