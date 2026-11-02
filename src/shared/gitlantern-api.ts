export type GitCheck =
  | { state: 'ok'; version: string; path: string }
  | { state: 'missing' }
  | { state: 'too-old'; version: string }

export interface Identity {
  name: string | null
  email: string | null
}

export interface OpenedRepository {
  path: string
  name: string
  identity: Identity
}

export type OpenResult =
  | { kind: 'opened'; repository: OpenedRepository }
  | { kind: 'not-a-repository'; folder: string; message: string }
  | { kind: 'failed'; message: string }
