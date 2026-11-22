import type { Notice } from '../shared/notices'

export interface Notices {
  list(): Notice[]
  raise(notice: Notice): void
  dismiss(notice: Notice): void
}

/** The messages the window shows. `onChange` receives the whole list after each change. */
export function createNotices(onChange: (notices: Notice[]) => void): Notices {
  let raised: Notice[] = []

  return {
    list: () => [...raised],
    raise: (notice) => {
      if (raised.includes(notice)) return
      raised = [...raised, notice]
      onChange([...raised])
    },
    dismiss: (notice) => {
      if (!raised.includes(notice)) return
      raised = raised.filter((other) => other !== notice)
      onChange([...raised])
    }
  }
}
