import { cloneFolderName } from './clone-folder-name'

/** The full path of the folder a clone of `url` goes into, or null when the URL gives no usable folder name. */
export function cloneDestination(url: string, parentFolder: string, separator: string): string | null {
    const folderName = cloneFolderName(url)
    return folderName === null ? null : `${parentFolder.replace(/[\\/]+$/, '')}${separator}${folderName}`
}
