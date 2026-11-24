import { readdir } from 'node:fs/promises'
import { isAbsolute, join } from 'node:path'
import { runGit } from './run-git'

export type RepositoryProgram =
    { kind: 'setting'; name: string; value: string } | { kind: 'hook'; name: string }

const REPOSITORY_SCOPES = new Set(['local', 'worktree'])

// Git lowercases section and variable names in this output, and keeps subsection case.
const PROGRAM_SETTING_PATTERNS = [
    /^core\.(sshcommand|hookspath|pager|editor|askpass|gitproxy|alternaterefscommand)$/,
    /^diff\.external$/,
    /^diff\..+\.(command|textconv)$/,
    /^filter\..+\.(clean|smudge|process)$/,
    /^merge\..+\.driver$/,
    /^(difftool|mergetool)\..+\.(cmd|path)$/,
    /^credential\.(.+\.)?helper$/,
    /^gpg\.(.+\.)?program$/,
    /^sequence\.editor$/,
    /^pager\./,
    /^remote\..+\.(uploadpack|receivepack|vcs)$/,
    /^trailer\..+\.(command|cmd)$/,
    /^(browser|man)\..+\.(cmd|path)$/,
    /^web\.browser$/,
    /^hook\..+\.command$/,
    /^sendemail\.(.+\.)?(sendmailcmd|tocmd|cccmd)$/
]

function isProgramSetting(name: string, value: string): boolean {
    if (name === 'core.fsmonitor') return value !== 'true' && value !== 'false'
    if (/^alias\./.test(name) || /^submodule\..+\.update$/.test(name)) return value.startsWith('!')
    return PROGRAM_SETTING_PATTERNS.some((pattern) => pattern.test(name))
}

// Each entry is three NUL-terminated fields: scope, origin, then the name and value joined by a newline.
function parseRepositorySettings(configOutput: string): { name: string; value: string }[] {
    const fields = configOutput.split('\0')
    const settings: { name: string; value: string }[] = []

    for (let i = 0; i + 2 < fields.length; i += 3) {
        if (!REPOSITORY_SCOPES.has(fields[i])) continue
        const nameAndValue = fields[i + 2]
        const newlineIndex = nameAndValue.indexOf('\n')
        settings.push(
            newlineIndex === -1
                ? { name: nameAndValue, value: '' }
                : { name: nameAndValue.slice(0, newlineIndex), value: nameAndValue.slice(newlineIndex + 1) }
        )
    }

    return settings
}

async function listHookNames(hooksFolder: string): Promise<string[]> {
    try {
        const entries = await readdir(hooksFolder, { withFileTypes: true })
        return entries
            .filter((entry) => !entry.isDirectory() && !entry.name.endsWith('.sample'))
            .map((entry) => entry.name)
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw error
    }
}

function expectSuccess(result: { exitCode: number; stderr: Buffer }): void {
    if (result.exitCode !== 0) throw new Error(result.stderr.toString().trim())
}

export async function findRepositoryPrograms(repository: {
    gitPath: string
    repositoryPath: string
}): Promise<RepositoryProgram[]> {
    const configResult = await runGit({
        ...repository,
        gitArguments: ['config', '--list', '--show-scope', '--show-origin', '-z']
    })
    expectSuccess(configResult)

    const hooksPathResult = await runGit({
        ...repository,
        gitArguments: ['rev-parse', '--git-path', 'hooks']
    })
    expectSuccess(hooksPathResult)
    const hooksPath = hooksPathResult.stdout.toString().trim()
    const hooksFolder = isAbsolute(hooksPath) ? hooksPath : join(repository.repositoryPath, hooksPath)

    return [
        ...parseRepositorySettings(configResult.stdout.toString())
            .filter(({ name, value }) => isProgramSetting(name, value))
            .map((setting): RepositoryProgram => ({ kind: 'setting', ...setting })),
        ...(await listHookNames(hooksFolder)).map((name): RepositoryProgram => ({ kind: 'hook', name }))
    ]
}
