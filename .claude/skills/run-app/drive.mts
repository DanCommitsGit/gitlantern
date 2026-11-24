// Launches the built app, opens a repository and runs the commands given as arguments.
// Usage: node .claude/skills/run-app/drive.mts [--repo <folder>] [--out <folder>] "<command>" ...
import { mkdirSync, mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { _electron as electron, type Locator, type Page } from 'playwright-core'

const APP_FOLDER = resolve(import.meta.dirname, '../../..')
const WINDOW_SIZE = { width: 1360, height: 840 }
const SETTLE_MILLISECONDS = 600
// The electron package's main export is the path to its executable.
const electronPath = createRequire(import.meta.url)('electron') as string

interface Options {
    repository: string
    output: string
    commands: string[]
}

type Command = (page: Page, argument: string, output: string) => Promise<void>

function readOptions(argv: string[]): Options {
    const options: Options = {
        repository: APP_FOLDER,
        output: join(tmpdir(), 'gitlantern-run'),
        commands: []
    }
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--repo') options.repository = resolve(argv[++i])
        else if (argv[i] === '--out') options.output = resolve(argv[++i])
        else options.commands.push(argv[i])
    }
    return options
}

function pause(milliseconds: number): Promise<void> {
    return new Promise((done) => setTimeout(done, milliseconds))
}

// Searches an open dialog first, so a button there wins over one with the same name behind it.
async function scopeOf(page: Page): Promise<Page | Locator> {
    const dialog = page.getByRole('dialog')
    return (await dialog.count()) > 0 ? dialog.last() : page
}

function splitArgument(argument: string): [string, string] {
    const separator = argument.indexOf('=')
    if (separator === -1) throw new Error(`Expected "<target>=<value>", got "${argument}"`)
    return [argument.slice(0, separator), argument.slice(separator + 1)]
}

const COMMANDS: Record<string, Command> = {
    // Buttons and links by their accessible name, which is their text or aria-label.
    async click(page, name) {
        const scope = await scopeOf(page)
        await scope
            .getByRole('button', { name, exact: true })
            .or(scope.getByRole('link', { name, exact: true }))
            .first()
            .click()
    },
    // A text box by its label or placeholder: fill Summary=Fix the parser
    async fill(page, argument) {
        const [target, value] = splitArgument(argument)
        const scope = await scopeOf(page)
        await scope
            .getByLabel(target, { exact: true })
            .or(scope.getByPlaceholder(target, { exact: true }))
            .first()
            .fill(value)
    },
    // A checkbox or radio button by its label.
    async check(page, label) {
        await (await scopeOf(page)).getByLabel(label, { exact: true }).first().check()
    },
    async press(page, key) {
        await page.keyboard.press(key)
    },
    async wait(_page, milliseconds) {
        await pause(Number(milliseconds))
    },
    async screenshot(page, name, output) {
        await pause(SETTLE_MILLISECONDS)
        const file = join(output, `${name || Date.now()}.png`)
        await page.screenshot({ path: file })
        console.log('screenshot:', file)
    },
    // The visible text of the first visible match for a CSS selector, or of the whole window.
    async text(page, selector) {
        const target = selector ? page.locator(`${selector}:visible`).first() : page.locator('body')
        console.log(await target.innerText())
    },
    async eval(page, expression) {
        console.log(JSON.stringify(await page.evaluate(expression)))
    }
}

async function main(): Promise<void> {
    const options = readOptions(process.argv.slice(2))
    if (!existsSync(join(APP_FOLDER, 'out/main/index.js'))) {
        throw new Error('No build found. Run "npx electron-vite build" first.')
    }
    mkdirSync(options.output, { recursive: true })

    const app = await electron.launch({
        executablePath: electronPath,
        // A fresh profile, so a run never reads or changes the real settings and trusted repositories.
        args: [APP_FOLDER, `--user-data-dir=${mkdtempSync(join(options.output, 'profile-'))}`],
        timeout: 30_000
    })
    const errors: string[] = []
    try {
        const page = await app.firstWindow()
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('console', (message) => message.type() === 'error' && errors.push(message.text()))

        await app.evaluate(
            ({ dialog, BrowserWindow }, { folder, size }) => {
                dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] })
                BrowserWindow.getAllWindows()[0].setSize(size.width, size.height)
            },
            { folder: options.repository, size: WINDOW_SIZE }
        )

        await page.getByRole('button', { name: /open/i }).first().click()
        await page.getByRole('navigation', { name: 'Views' }).or(page.getByRole('dialog')).first().waitFor()
        if ((await page.getByRole('dialog').count()) > 0)
            console.log('A dialog is open after opening the repository.')
        console.log('opened:', options.repository)

        for (const command of options.commands) {
            const space = command.indexOf(' ')
            const name = space === -1 ? command : command.slice(0, space)
            const argument = space === -1 ? '' : command.slice(space + 1)
            if (!(name in COMMANDS))
                throw new Error(`Unknown command "${name}". Commands: ${Object.keys(COMMANDS).join(', ')}`)
            await COMMANDS[name](page, argument, options.output)
            console.log('done:', command)
        }
    } finally {
        console.log('page errors:', JSON.stringify(errors))
        await app.close()
    }
}

main().catch((error) => {
    console.error(error.message)
    process.exit(1)
})
