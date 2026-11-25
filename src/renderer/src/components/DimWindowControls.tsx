import { useEffect } from 'react'

/** While mounted, the window controls are tinted like the dialog scrim. */
export function DimWindowControls(): null {
    useEffect(() => {
        void window.api.setDialogOpen(true)
        return () => void window.api.setDialogOpen(false)
    }, [])
    return null
}
