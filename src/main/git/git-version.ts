const MINIMUM_MAJOR_VERSION = 2
// safe.bareRepository arrived in 2.38.
const MINIMUM_MINOR_VERSION = 38

export function isSupportedGitVersion(versionOutput: string): boolean {
  const match = /^git version (\d+)\.(\d+)/.exec(versionOutput)
  if (match === null) return false

  const major = Number(match[1])
  const minor = Number(match[2])
  return (
    major > MINIMUM_MAJOR_VERSION ||
    (major === MINIMUM_MAJOR_VERSION && minor >= MINIMUM_MINOR_VERSION)
  )
}
