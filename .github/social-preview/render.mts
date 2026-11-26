// Renders .github/social-preview.png with the installed Microsoft Edge.
// Usage: node .github/social-preview/render.mts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright-core'
import { glowPixels, type Point } from './glow.mts'

const GITHUB_FOLDER = resolve(import.meta.dirname, '..')
const IMAGE_SIZE = { width: 1280, height: 640 }
// The glow is soft enough to compute at half size and stretch.
const GLOW_SCALE = 2
// The lantern's top left corner in image and build/logo.svg coordinates.
const ON_IMAGE: Point = { x: 83, y: 140 }
const ON_LOGO: Point = { x: 17, y: 7 }
const LANTERN_SCALE = 360 / 49

// The drawing inside build/logo.svg without its tile.
function lanternMarkup(): string {
    const logo = readFileSync(resolve(GITHUB_FOLDER, '../build/logo.svg'), 'utf8')
    const drawing = logo.replace(/<\/?svg[^>]*>/g, '')
    const lantern = drawing.replace(/<rect width="64" height="64"[^>]*\/>/, '')
    if (lantern === drawing) throw new Error('build/logo.svg has no 64 by 64 tile to remove.')
    return lantern
}

function toLogoPoint(glowPixel: Point): Point {
    return {
        x: (glowPixel.x * GLOW_SCALE - ON_IMAGE.x) / LANTERN_SCALE + ON_LOGO.x,
        y: (glowPixel.y * GLOW_SCALE - ON_IMAGE.y) / LANTERN_SCALE + ON_LOGO.y
    }
}

async function main(): Promise<void> {
    const glowSize = {
        width: IMAGE_SIZE.width / GLOW_SCALE,
        height: IMAGE_SIZE.height / GLOW_SCALE
    }
    const glow = glowPixels(glowSize.width, glowSize.height, toLogoPoint)

    const browser = await chromium.launch({ channel: 'msedge', args: ['--disable-lcd-antialiasing'] })
    try {
        const page = await browser.newPage({ viewport: IMAGE_SIZE })
        await page.goto(pathToFileURL(resolve(GITHUB_FOLDER, 'social-preview.html')).href)
        await page.evaluate(
            ({ size, base64Pixels, lantern, transform }) => {
                const canvas = document.createElement('canvas')
                canvas.width = size.width
                canvas.height = size.height
                const bytes = Uint8ClampedArray.from(atob(base64Pixels), (byte) => byte.charCodeAt(0))
                canvas.getContext('2d')!.putImageData(new ImageData(bytes, size.width), 0, 0)
                document.getElementById('glow')!.setAttribute('href', canvas.toDataURL())
                const drawing = document.getElementById('lantern')!
                drawing.setAttribute('transform', transform)
                drawing.innerHTML = lantern
            },
            {
                size: glowSize,
                base64Pixels: Buffer.from(glow.buffer).toString('base64'),
                lantern: lanternMarkup(),
                transform: `translate(${ON_IMAGE.x} ${ON_IMAGE.y}) scale(${LANTERN_SCALE}) translate(${-ON_LOGO.x} ${-ON_LOGO.y})`
            }
        )
        await page.locator('#glow').waitFor()
        await page.evaluate(() => document.fonts.ready)
        await page.screenshot({ path: resolve(GITHUB_FOLDER, 'social-preview.png') })
    } finally {
        await browser.close()
    }
}

await main()
