import { app, session, shell } from 'electron'
import { isExternalLinkAllowed, isSameOrigin } from './url-policy'

export function restrictWebContents(rendererUrl: string): void {
    app.on('web-contents-created', (_event, contents) => {
        contents.on('will-navigate', (event, url) => {
            if (!isSameOrigin(url, rendererUrl)) event.preventDefault()
        })

        contents.setWindowOpenHandler(({ url }) => {
            if (isExternalLinkAllowed(url)) shell.openExternal(url)
            return { action: 'deny' }
        })
    })
}

export function denyAllPermissions(): void {
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
        callback(false)
    })
    session.defaultSession.setPermissionCheckHandler(() => false)
}
