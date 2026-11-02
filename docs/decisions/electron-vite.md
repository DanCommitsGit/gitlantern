# Build with electron-vite

Status: Accepted

## Context

electron-vite, Electron Forge and bare Electron were each scaffolded and compared hands-on. Forge is Electron's own tool and needs about half as many packages. electron-vite comes with React set up, and its Windows installer was 121 MB against 155 MB for Forge. Bare Electron comes with no React, TypeScript or installer setup.

## Decision

Use electron-vite, for its ready React setup, its folder layout and its smaller installer.
