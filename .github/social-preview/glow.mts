// The light around the lantern, in the coordinates of build/logo.svg.

export interface Point {
    x: number
    y: number
}

interface Edge {
    y: number
    from: number
    to: number
}

const LANTERN_CENTER: Point = { x: 32, y: 37 }
// The edges of the cap and base that face the glass.
const CAP_EDGE: Edge = { y: 24, from: 17, to: 47 }
const BASE_EDGE: Edge = { y: 50, from: 17, to: 47 }
// The glass is a trapezoid that narrows toward the bottom.
const GLASS = { top: 26, bottom: 48, topLeft: 20, topRight: 44, bottomInset: 3 }

const GOLD = [242, 181, 58]
// Opacity of the light just beside the glass, and the most any pixel gets.
const STRENGTH = 0.2
const MAXIMUM_OPACITY = 0.28
const BESIDE_GLASS: Point = { x: 46, y: LANTERN_CENTER.y }
const HALF_BRIGHTNESS_DISTANCE = 11
const REACH = 62
const CUTOFF_FROM_CENTER = 78
const SAMPLE_ROWS = 11
const SAMPLE_COLUMNS = 12

// Points spread evenly over the glass, each one a source of light.
function lightSources(): Point[] {
    const sources: Point[] = []
    for (let row = 0; row < SAMPLE_ROWS; row++) {
        const height = GLASS.bottom - GLASS.top
        const y = GLASS.top + (height * (row + 0.5)) / SAMPLE_ROWS
        const inset = (GLASS.bottomInset * (y - GLASS.top)) / height
        const left = GLASS.topLeft + inset
        const width = GLASS.topRight - inset - left
        for (let column = 0; column < SAMPLE_COLUMNS; column++) {
            sources.push({ x: left + (width * (column + 0.5)) / SAMPLE_COLUMNS, y })
        }
    }
    return sources
}

function isBlocked(source: Point, point: Point, edge: Edge): boolean {
    const fraction = (source.y - edge.y) / (source.y - point.y)
    const crossingX = source.x + fraction * (point.x - source.x)
    return crossingX >= edge.from && crossingX <= edge.to
}

function lightAt(point: Point, sources: Point[]): number {
    let total = 0
    for (const source of sources) {
        if (point.y < CAP_EDGE.y && isBlocked(source, point, CAP_EDGE)) continue
        if (point.y > BASE_EDGE.y && isBlocked(source, point, BASE_EDGE)) continue
        const distance = Math.hypot(point.x - source.x, point.y - source.y)
        const reach = Math.max(0, 1 - distance / REACH)
        total += reach ** 2 / (1 + (distance / HALF_BRIGHTNESS_DISTANCE) ** 2)
    }
    return total / sources.length
}

// RGBA pixels of the light, shadowed by the cap and base.
// toLogoPoint turns the center of a pixel into logo coordinates.
export function glowPixels(
    width: number,
    height: number,
    toLogoPoint: (pixel: Point) => Point
): Uint8ClampedArray {
    const pixels = new Uint8ClampedArray(width * height * 4)
    const sources = lightSources()
    const lightBesideGlass = lightAt(BESIDE_GLASS, sources)
    // Seeded noise breaks up color banding and gives the same image on every render.
    let seed = 1
    const noise = (): number => {
        seed = (seed * 16807) % 2147483647
        return seed / 2147483647 - 0.5
    }
    for (let row = 0; row < height; row++) {
        for (let column = 0; column < width; column++) {
            const point = toLogoPoint({ x: column + 0.5, y: row + 0.5 })
            const fromCenter = Math.hypot(point.x - LANTERN_CENTER.x, point.y - LANTERN_CENTER.y)
            const light = fromCenter > CUTOFF_FROM_CENTER ? 0 : lightAt(point, sources)
            const opacity = Math.min(MAXIMUM_OPACITY, (STRENGTH * light) / lightBesideGlass)
            const alpha = opacity ? Math.round(opacity * 255 + noise()) : 0
            pixels.set([...GOLD, alpha], (row * width + column) * 4)
        }
    }
    return pixels
}
