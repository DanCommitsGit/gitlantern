import type { Notice } from '../../../shared/notices'
import { useNotices } from '../notices/use-notices'

const NOTICE_TEXT: Record<Notice, string> = {
    'app-data-not-saved':
        "Changes to your recent repositories, trusted programs and collapsed branch groups aren't being saved.",
    'settings-not-opened':
        "GitLantern couldn't open your settings, so it's using the defaults and can't save changes."
}

export function NoticeBanner(): React.JSX.Element | null {
    const notices = useNotices()
    if (notices.length === 0) return null

    return (
        <div className="flex-none divide-y divide-line">
            {notices.map((notice) => (
                <div
                    key={notice}
                    className="banner banner-warning flex items-center gap-2 rounded-none"
                    role="alert"
                >
                    <span className="min-w-0 flex-1">{NOTICE_TEXT[notice]}</span>
                    <button className="button" type="button" onClick={() => void window.api.showLogs()}>
                        Open logs
                    </button>
                    <button
                        className="button"
                        type="button"
                        onClick={() => void window.api.dismissNotice(notice)}
                    >
                        Dismiss
                    </button>
                </div>
            ))}
        </div>
    )
}
