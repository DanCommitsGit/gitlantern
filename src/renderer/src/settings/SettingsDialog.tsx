import { Dialog } from '@base-ui/react/dialog'
import { Settings2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { DimWindowControls } from '../components/DimWindowControls'
import { UpdateButton } from '../components/UpdateButton'
import { searchSettingsSections } from './search-settings'
import { useSettings } from './settings-context'
import { SETTINGS_SECTIONS } from './settings-sections'

const UPDATES_SECTION = SETTINGS_SECTIONS.find((section) => section.id === 'updates')!

export function SettingsDialog(): React.JSX.Element {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const visibleSections = searchSettingsSections(query)
    const { saveFailed } = useSettings()
    const [currentId, setCurrentId] = useState<string>(SETTINGS_SECTIONS[0].id)
    const sectionToScrollTo = useRef<string | null>(null)
    // After a sidebar click, the clicked section stays current until the user scrolls themselves,
    // because short sections near the end can't scroll to the top.
    const followClick = useRef(false)
    const current = visibleSections.some((section) => section.id === currentId)
        ? currentId
        : visibleSections[0]?.id

    function chooseSection(id: string): void {
        followClick.current = true
        setCurrentId(id)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    }

    function trackScroll(content: HTMLElement): void {
        if (followClick.current) return
        const atEnd = content.scrollTop + content.clientHeight >= content.scrollHeight - 1
        const sections = [...content.querySelectorAll('section')]
        const top = content.getBoundingClientRect().top
        const passed = sections.filter((section) => section.getBoundingClientRect().top - top <= 16)
        const section = atEnd ? sections.at(-1) : (passed.at(-1) ?? sections[0])
        if (section) setCurrentId(section.id)
    }

    function showUpdates(): void {
        setQuery('')
        sectionToScrollTo.current = UPDATES_SECTION.id
        followClick.current = true
        setCurrentId(UPDATES_SECTION.id)
        setOpen(true)
    }

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <UpdateButton onShowUpdates={showUpdates} />
            <Dialog.Trigger className="button button-quiet button-icon" aria-label="Settings">
                <Settings2 className="size-4 flex-none" />
            </Dialog.Trigger>
            <Dialog.Portal>
                <DimWindowControls />
                <Dialog.Backdrop className="dialog-backdrop" />
                <Dialog.Popup className="dialog h-[min(520px,calc(100vh-96px))] w-[min(760px,calc(100vw-48px))] flex-row gap-0 overflow-hidden p-0">
                    <nav
                        className="flex w-55 flex-none flex-col gap-0.5 border-r border-line bg-sunken px-2 py-4"
                        aria-label="Settings sections"
                    >
                        <Dialog.Title className="px-2 pb-3 text-head">Settings</Dialog.Title>
                        <input
                            className="input mb-2"
                            placeholder="Search settings"
                            aria-label="Search settings"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                        {visibleSections.map((section) => (
                            <button
                                key={section.id}
                                className="min-h-7.5 cursor-pointer rounded-md px-2 text-left font-medium text-ink-2 hover:bg-hover aria-[current=true]:bg-selected aria-[current=true]:font-semibold aria-[current=true]:text-ink"
                                type="button"
                                aria-current={section.id === current}
                                onClick={() => chooseSection(section.id)}
                            >
                                {section.name}
                            </button>
                        ))}
                        {visibleSections.length === 0 && (
                            <p className="px-2 text-small text-ink-2">No matching settings</p>
                        )}
                    </nav>
                    <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex flex-none items-center justify-end gap-2 px-5 pt-4">
                            {saveFailed && (
                                <div
                                    className="banner banner-danger flex min-w-0 flex-1 items-center gap-2"
                                    role="alert"
                                >
                                    <span className="min-w-0 flex-1">
                                        Couldn&apos;t save that setting. Try again.
                                    </span>
                                    <button
                                        className="button"
                                        type="button"
                                        onClick={() => void window.api.showLogs()}
                                    >
                                        Open logs
                                    </button>
                                </div>
                            )}
                            <Dialog.Close
                                className="button button-quiet button-icon"
                                aria-label="Close settings"
                            >
                                <X className="size-4 flex-none" />
                            </Dialog.Close>
                        </div>
                        <div
                            className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-5 pt-2 pb-4"
                            onScroll={(event) => trackScroll(event.currentTarget)}
                            onWheel={() => (followClick.current = false)}
                            onPointerDown={() => (followClick.current = false)}
                        >
                            {visibleSections.map(({ id, name, Panel }) => (
                                <section
                                    key={id}
                                    id={id}
                                    className="flex flex-col gap-4"
                                    aria-labelledby={`${id}-title`}
                                    ref={(element) => {
                                        if (element && sectionToScrollTo.current === id) {
                                            element.scrollIntoView()
                                            sectionToScrollTo.current = null
                                        }
                                    }}
                                >
                                    <h3 className="text-head" id={`${id}-title`}>
                                        {name}
                                    </h3>
                                    {Panel && <Panel />}
                                </section>
                            ))}
                        </div>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    )
}
