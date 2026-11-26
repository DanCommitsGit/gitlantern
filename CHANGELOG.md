# Changelog

## [0.6.0](https://github.com/DanCommitsGit/gitlantern/compare/v0.5.0...v0.6.0) (2026-11-26)


### Features

* add a Clone card to the welcome screen for cloning from a URL ([770d0bd](https://github.com/DanCommitsGit/gitlantern/commit/770d0bdffde0e06b067b0c71a9a6d84b33ba1494))
* add git's progress to the Clone dialog ([fa83910](https://github.com/DanCommitsGit/gitlantern/commit/fa83910ebefcf78117d7eb3721f2d7a7e74e5e2e))
* give the app a lantern icon, also shown in the title bar ([ffe8d98](https://github.com/DanCommitsGit/gitlantern/commit/ffe8d9826b4bfa281db9d0d872a86d059217e6a1))
* make the Cancel button stop a running clone ([280acff](https://github.com/DanCommitsGit/gitlantern/commit/280acff8d7e58503537d924a4f5aa45020caf1b1))
* show a Reload button when something goes wrong, and reload after a crash ([42f915e](https://github.com/DanCommitsGit/gitlantern/commit/42f915e5469f9574ecdd748104ae911542e1ff2c))


### Bug Fixes

* include crashes and unexpected errors in the logs ([27c1aa7](https://github.com/DanCommitsGit/gitlantern/commit/27c1aa70c175adc86ce05994251480fa523a4c37))
* let screen readers read the explanations of git terms ([61f7d68](https://github.com/DanCommitsGit/gitlantern/commit/61f7d680c94a1fef00978581e4a5a69b43705b1e))

## [0.5.0](https://github.com/DanCommitsGit/gitlantern/compare/v0.4.0...v0.5.0) (2026-11-25)


### Features

* add a notifications button to the title bar that lists errors and warnings ([c8be8cf](https://github.com/DanCommitsGit/gitlantern/commit/c8be8cfb97c1a61e380e6ba9da0195ecbfbd9be8))
* add Fetch, Pull and Push buttons to the title bar ([1bf2799](https://github.com/DanCommitsGit/gitlantern/commit/1bf2799d197c6b27af6bd5320734dbe8a471126c))
* choose a light, dark or system theme in settings ([050a7e0](https://github.com/DanCommitsGit/gitlantern/commit/050a7e00154afdf61814f2afd17b85244fe07226))
* close error and warning banners with an X ([25d3cc2](https://github.com/DanCommitsGit/gitlantern/commit/25d3cc2ff12a41194c1cfd8fd24ede74d854493c))
* open the last repository on startup, with a setting to show the welcome screen instead ([2ff4953](https://github.com/DanCommitsGit/gitlantern/commit/2ff4953291c0e54f7cd83c04df8639e819415425))
* show every local branch in the Branches list, not just the current one ([a07f918](https://github.com/DanCommitsGit/gitlantern/commit/a07f918abe0e2ef1b3d8820d2bb4a81464139441))
* warn when recent repositories and trusted programs can't be saved ([a60b5fe](https://github.com/DanCommitsGit/gitlantern/commit/a60b5fe6cb4fbe1f1514ffb22c677aae660b147b))
* warn when your settings can't be opened and the defaults are used ([8f3b2e8](https://github.com/DanCommitsGit/gitlantern/commit/8f3b2e8a4c89ed21ccc31527469dbbc6463d7c80))


### Bug Fixes

* dim the window controls when a dialog is open ([6ea0c9d](https://github.com/DanCommitsGit/gitlantern/commit/6ea0c9d638614720fdb069b5a7ef6cfb2e237970))
* remove a notification when the problem it reports stops, and keep a dismissed banner hidden when it repeats ([a8fb142](https://github.com/DanCommitsGit/gitlantern/commit/a8fb14205e45751c381b096f75f6dcb3e61b727a))
* remove the "Working tree clean" label that looked like a button ([e3389e7](https://github.com/DanCommitsGit/gitlantern/commit/e3389e70c2381bc43781ff9682b04de0b8a644b5))
* show an error when a repository can't be opened instead of doing nothing ([37f3470](https://github.com/DanCommitsGit/gitlantern/commit/37f3470e3de396561c308c313c68e4f0a0f4fcbe))
* show errors from reading the commit history and a commit's files in the notifications list ([ff3a7ee](https://github.com/DanCommitsGit/gitlantern/commit/ff3a7ee1f7e008224ff2259e04202dce9091ade7))
* show the empty last line in staged changes to files named like 2:notes.txt ([96de720](https://github.com/DanCommitsGit/gitlantern/commit/96de72044e842f8e0da282d9158dd3e7b3c472f6))
* show U for new files that aren't staged yet and ! for files with merge conflicts ([f131867](https://github.com/DanCommitsGit/gitlantern/commit/f131867377fb055aea92f643310740a7c4c8a0f9))
* stop the app being clickable while choosing git's location ([4889e5f](https://github.com/DanCommitsGit/gitlantern/commit/4889e5f3337fb0a69a45ea64c4425ad85b601d49))

## [0.4.0](https://github.com/DanCommitsGit/gitlantern/compare/v0.3.0...v0.4.0) (2026-11-18)


### Features

* add a History view with the commit log, graph and commit details ([5015ce1](https://github.com/DanCommitsGit/gitlantern/commit/5015ce113b0e481725ac82f21877e3c1c4e491dc))
* add macOS universal, Windows portable and Linux rpm downloads ([f4e7a5a](https://github.com/DanCommitsGit/gitlantern/commit/f4e7a5a0c995db4109d5fd42b9b51009e38eee45))
* change settings to one scrolling page with a sidebar that jumps to sections ([9ebe98f](https://github.com/DanCommitsGit/gitlantern/commit/9ebe98fc9e7ca8977380c63bbb65df7efe329176))
* check for updates and install them automatically ([9d2aacf](https://github.com/DanCommitsGit/gitlantern/commit/9d2aacfe77de48a218bd5728f26cfb9fa76f4ba3))
* read the commit log, a commit's files and their diffs ([4c88493](https://github.com/DanCommitsGit/gitlantern/commit/4c8849302ef12b91aedad5ce7bad44ee8a5fcbab))


### Bug Fixes

* disable checking for updates in development builds ([240725a](https://github.com/DanCommitsGit/gitlantern/commit/240725a7f34e19f8b5a0cc2cdefeefa47ca2c2be))
* spell the product name GitLantern ([b3bb7c7](https://github.com/DanCommitsGit/gitlantern/commit/b3bb7c71bee08858971c0da90009144d7f9960f3))

## [0.3.0](https://github.com/DanCommitsGit/gitlantern/compare/v0.2.0...v0.3.0) (2026-11-15)


### Features

* add a search box to settings ([adc111c](https://github.com/DanCommitsGit/gitlantern/commit/adc111cf0766353455c4452429ae05410c286db3))
* add a setting to list changed files with checkboxes ([2212aec](https://github.com/DanCommitsGit/gitlantern/commit/2212aeceb27992483ee5a35a6fd78effc4e6fece))
* add a setting to show a command card at each button ([50aa24a](https://github.com/DanCommitsGit/gitlantern/commit/50aa24ac2332fdbd71f2c657260a1a44a2845cf7))
* drop the Part label from half-staged files in the two lists ([8f5290f](https://github.com/DanCommitsGit/gitlantern/commit/8f5290f76b42f3d4305e9ffd91c5625964380be8))
* see a diff side by side or with changed text marked ([23ab01f](https://github.com/DanCommitsGit/gitlantern/commit/23ab01faa707b5240bb8ad0ba04f8eee30404112))
* show a message with an Open logs button when a setting can't be saved ([adc7609](https://github.com/DanCommitsGit/gitlantern/commit/adc7609ba404d408b12337c4b552fb47ad57370c))
* show the empty line after a file's last line break in diffs ([ddca3b8](https://github.com/DanCommitsGit/gitlantern/commit/ddca3b8fb5a53d904301e30695fdb891155e0d7f))
* zoom in with Ctrl+= as well as Ctrl+Plus ([91b8b0c](https://github.com/DanCommitsGit/gitlantern/commit/91b8b0cd5e145d2dbb8000082a21331857373eb5))


### Bug Fixes

* draw icons at Lucide's default stroke width ([e65379d](https://github.com/DanCommitsGit/gitlantern/commit/e65379d4f6d71ae35a67d8abf4c023775aa4a275))
* keep the title bar border visible under the window buttons when zoomed out ([c4f166c](https://github.com/DanCommitsGit/gitlantern/commit/c4f166c9d27317044c0ae9a56e30c34d246ddf1c))
* recover from a damaged or unreadable settings.json or config.json ([6df37ae](https://github.com/DanCommitsGit/gitlantern/commit/6df37ae29335483fd58684ecffedb6936cda064e))
* round the diff view group's end buttons instead of clipping them ([685bc45](https://github.com/DanCommitsGit/gitlantern/commit/685bc4582f13f618f00b0d22d41e37ab383a2007))
* show the whole focus ring on the diff view, Stage all and History buttons ([45c8b45](https://github.com/DanCommitsGit/gitlantern/commit/45c8b451c175b6a9309c6126146b7e4044a67c0a))

## [0.2.0](https://github.com/DanCommitsGit/gitlantern/compare/v0.1.2...v0.2.0) (2026-11-14)


### Features

* commit staged changes with a summary and description ([546949a](https://github.com/DanCommitsGit/gitlantern/commit/546949a56ae90da4a0f1a1ba5faa0ca4b4102060))
* create a repository in a folder that doesn't have one ([1b2cfdc](https://github.com/DanCommitsGit/gitlantern/commit/1b2cfdceda4b72a5290becaa66d03751db774d06))
* explain binary, renamed, large and conflicted files instead of showing an empty diff ([c1111fe](https://github.com/DanCommitsGit/gitlantern/commit/c1111fe69e59492cf27851650fb4daed53167ebc))
* explain git terms when you hover over or focus on them ([9c754fd](https://github.com/DanCommitsGit/gitlantern/commit/9c754fde2d91546dffb86304eb98e979cbb11a82))
* explain how to install or upgrade git when it's missing or too old ([7db2978](https://github.com/DanCommitsGit/gitlantern/commit/7db2978d8f9dc63771fe8e0c4a2450c4066cd149))
* follow the system's light or dark theme ([28c4e0a](https://github.com/DanCommitsGit/gitlantern/commit/28c4e0aae4e301d19b4df3d10e52bc6711aa5dc9))
* merge the title bar into the app's top bar and open at a larger size ([0509bc8](https://github.com/DanCommitsGit/gitlantern/commit/0509bc822af10339e6ce2ac3e3dd7f53e10a51c3))
* open a repository from a folder or your recent list ([6001582](https://github.com/DanCommitsGit/gitlantern/commit/6001582a70bcee803bd1ce2f2e3250db93f4adca))
* pick up edits made outside the app when you return to it ([d8a195f](https://github.com/DanCommitsGit/gitlantern/commit/d8a195f728634c8091d26bb458164c49e0bc2baa))
* say when there's nothing to commit or the repository is empty ([0f08537](https://github.com/DanCommitsGit/gitlantern/commit/0f0853767388e63ba686a0d0a2ad5e78575ec815))
* see every command that ran, with its output ([eee86b9](https://github.com/DanCommitsGit/gitlantern/commit/eee86b981a253c76e1efc7e7f116c30ddfc22aa4))
* see what changed in a file, line by line ([e1171aa](https://github.com/DanCommitsGit/gitlantern/commit/e1171aa33ee7ec9c15848dfe0f8a92eb83e15ba8))
* see your current branch and your unstaged and staged files ([a8b223b](https://github.com/DanCommitsGit/gitlantern/commit/a8b223b18fc6377032c4e83d379c31d093e7b379))
* set your name and email when git doesn't have them ([f6bbcb9](https://github.com/DanCommitsGit/gitlantern/commit/f6bbcb98c1b7aa6a82572c3d06a27187d9b2b2ae))
* show the git command for an action before you click it ([5379477](https://github.com/DanCommitsGit/gitlantern/commit/5379477a9d094de448390eb89b10de1e52a63392))
* stage and unstage files ([b0715e4](https://github.com/DanCommitsGit/gitlantern/commit/b0715e4fb0a7a8d49464bcb3ed650d4f09f2cb28))
* warn before opening a repository that can run programs on your computer ([11876a2](https://github.com/DanCommitsGit/gitlantern/commit/11876a21e2bbdfdbdd4ac7f14044bc9b748247b4))


### Bug Fixes

* title bar overlay height so border doesn't clip ([03c2b94](https://github.com/DanCommitsGit/gitlantern/commit/03c2b949ff48d3fa4a741e0c6e7d173b9de0f58f))
* update Electron to 45.2.3 ([#6](https://github.com/DanCommitsGit/gitlantern/issues/6)) ([2892ba5](https://github.com/DanCommitsGit/gitlantern/commit/2892ba5af6fa87a3a3faf10416f0a1ec6d3805be))

## [0.1.2](https://github.com/DanCommitsGit/gitlantern/compare/v0.1.1...v0.1.2) (2026-11-02)


### Bug Fixes

* keep the macOS app signature valid after flipping fuses ([fa37331](https://github.com/DanCommitsGit/gitlantern/commit/fa37331477df77b0aac129f98dff7f4cbd1895b1))

## [0.1.1](https://github.com/DanCommitsGit/gitlantern/compare/v0.1.0...v0.1.1) (2026-11-02)


### Bug Fixes

* lock down the app window and packaged binary ([b60aaa6](https://github.com/DanCommitsGit/gitlantern/commit/b60aaa638252e96d91b7bab032e0c81ecdbd5a04))
