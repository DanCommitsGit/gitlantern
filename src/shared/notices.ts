export const NOTICES = ['app-data-not-saved', 'settings-not-opened'] as const

export type Notice = (typeof NOTICES)[number]
