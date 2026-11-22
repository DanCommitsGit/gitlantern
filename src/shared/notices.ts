export const NOTICES = ['app-data-not-saved'] as const

export type Notice = (typeof NOTICES)[number]
