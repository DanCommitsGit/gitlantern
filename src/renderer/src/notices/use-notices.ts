import { useEffect, useState } from 'react'
import type { Notice } from '../../../shared/notices'

/** The notices to show, empty until the first answer arrives. */
export function useNotices(): Notice[] {
    const [notices, setNotices] = useState<Notice[]>([])

    useEffect(() => {
        void window.api.readNotices().then(setNotices, (error: unknown) => {
            console.error('Could not read the notices', error)
        })
        return window.api.onNotices(setNotices)
    }, [])

    return notices
}
