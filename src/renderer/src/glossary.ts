export interface GlossaryEntry {
  term: string
  explanation: string
  command?: string
}

export const GLOSSARY = {
  unstaged: {
    term: 'Unstaged',
    explanation: "Changes on your disk that you haven't picked for the next commit.",
    command: 'git diff'
  },
  staged: {
    term: 'Staged',
    explanation: "Changes you've picked for the next commit. Anything else stays out of it.",
    command: 'git add <file>'
  },
  head: {
    term: 'HEAD',
    explanation: "The commit you're on right now, usually the tip of the current branch."
  },
  summary: {
    term: 'Summary',
    explanation: 'One line saying what this commit does.',
    command: 'git commit -m "<summary>"'
  },
  description: {
    term: 'Description',
    explanation: 'Optional. More detail about why this change was made.',
    command: 'git commit -m "<summary>" -m "<description>"'
  }
} satisfies Record<string, GlossaryEntry>
