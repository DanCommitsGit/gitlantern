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

export type RepositoryProgramSummary =
  { kind: 'setting'; name: string; value: string } | { kind: 'hook'; name: string }

export type OpenResult =
  | { kind: 'opened'; repository: OpenedRepository }
  | { kind: 'not-a-repository'; folder: string; message: string }
  | { kind: 'needs-trust'; path: string; programs: RepositoryProgramSummary[] }
  | { kind: 'failed'; message: string }
