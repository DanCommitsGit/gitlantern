import type { GitlanternApi } from '../shared/gitlantern-api'

declare global {
    interface Window {
        api: GitlanternApi
    }
}
