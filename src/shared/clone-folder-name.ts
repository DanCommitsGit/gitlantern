// Characters Windows doesn't allow in a folder name.
const UNUSABLE_CHARACTERS = /[<>:"|?*]/

// Follows git_url_basename in git's dir.c, which `git clone` uses to name the new folder. Backslashes
// separate folders as well, as in git on Windows.
function gitFolderName(url: string): string {
    const schemeEnd = url.indexOf('://')
    const afterScheme = schemeEnd === -1 ? url : url.slice(schemeEnd + 3)
    // A user name and password end at the last @ before the first slash.
    const hostPart = afterScheme.split(/[\\/]/, 1)[0] ?? ''
    let path = afterScheme.slice(hostPart.lastIndexOf('@') + 1).replace(/[\\/ \t\r\n]+$/, '')
    if (path.length > 5 && /[\\/]\.git$/.test(path)) path = path.slice(0, -5).replace(/[\\/]+$/, '')
    // A bare host name loses its port number.
    if (!path.includes('/')) path = path.replace(/:\d*$/, '')

    const lastSegment = path.split(/[\\/:]/).pop() ?? ''
    // shortcut: git also drops the ending of a local .bundle file, which takes reading the disk to recognise.
    return (
        lastSegment
            .replace(/\.git$/, '')
            // Runs of spaces and control characters become one space, and none is left at either end.
            // eslint-disable-next-line no-control-regex
            .replace(/[\u0000- ]+/g, ' ')
            .replace(/^ | $/g, '')
    )
}

/** The folder name `git clone` picks for this URL, or null when that name is empty or not valid on Windows. */
export function cloneFolderName(url: string): string | null {
    const name = gitFolderName(url.trim())
    return name === '' || name === '.' || name === '..' || UNUSABLE_CHARACTERS.test(name) ? null : name
}
