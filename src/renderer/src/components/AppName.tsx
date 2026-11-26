import { LogoMark } from './LogoMark'
import { Wordmark } from './Wordmark'

export function AppName(): React.JSX.Element {
    return (
        <span className="flex items-center gap-2 font-mono font-semibold">
            <LogoMark />
            <Wordmark />
        </span>
    )
}
