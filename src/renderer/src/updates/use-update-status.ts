import { useEffect, useState } from 'react'
import type { UpdateStatus } from '../../../shared/update-types'

/** The app's update status, or null until the first answer arrives. */
export function useUpdateStatus(): UpdateStatus | null {
    const [status, setStatus] = useState<UpdateStatus | null>(null)

    useEffect(() => {
        void window.api.readUpdateStatus().then(setStatus, (error: unknown) => {
            console.error('Could not read the update status', error)
        })
        return window.api.onUpdateStatus(setStatus)
    }, [])

    return status
}
