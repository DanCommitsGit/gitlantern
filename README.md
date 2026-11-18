# GitLantern

An open source desktop git client.

GitLantern is in early development and has no usable features yet.

## Build from source

There are no releases yet, so building from source is the only way to get GitLantern. You need Node.js 24 and git.

```bash
git clone https://github.com/DanCommitsGit/gitlantern.git
cd gitlantern
npm install
npm run build:win
```

On macOS or Linux, use `npm run build:mac` or `npm run build:linux` instead. The installer is written to `dist/`.

The installers are not code-signed yet, so Windows and macOS warn on first launch.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
