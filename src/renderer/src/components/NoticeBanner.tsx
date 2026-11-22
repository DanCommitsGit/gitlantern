import type { Notice } from '../../../shared/notices'
import { useNotices } from '../notices/use-notices'

const NOTICE_TEXT: Record<Notice, string> = {
  'app-data-not-saved':
    "Changes to your recent repositories, trusted programs and collapsed branch groups aren't being saved."
}

export function NoticeBanner(): React.JSX.Element {
  const notices = useNotices()

  return (
    <>
      {notices.map((notice) => (
        <div
          key={notice}
          className="banner banner-warning flex flex-none items-center gap-2 rounded-none"
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
    </>
  )
}
