import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  fit,
  pan,
  screenToWorld,
  worldToScreen,
  zoomAt,
} from './camera.ts'

describe('camera', () => {
  const camera = { x: -10.5, y: 3, zoom: 16 }

  it('converts screen to world and back', () => {
    const [wx, wy] = screenToWorld(camera, 123, 456)
    expect(worldToScreen(camera, wx, wy)).toEqual([123, 456])
    expect(screenToWorld(camera, 0, 0)).toEqual([-10.5, 3])
  })

  it('pans by a screen distance', () => {
    expect(pan(camera, 32, -16)).toEqual({ x: -12.5, y: 4, zoom: 16 })
  })

  it('zooms around a point that stays under the cursor', () => {
    const before = screenToWorld(camera, 200, 100)
    const zoomed = zoomAt(camera, 200, 100, 40)
    expect(zoomed.zoom).toBe(40)
    const after = screenToWorld(zoomed, 200, 100)
    expect(after[0]).toBeCloseTo(before[0])
    expect(after[1]).toBeCloseTo(before[1])
  })

  it('keeps the zoom within its limits', () => {
    expect(zoomAt(camera, 0, 0, 1000).zoom).toBe(MAX_ZOOM)
    expect(zoomAt(camera, 0, 0, 0.1).zoom).toBe(MIN_ZOOM)
  })

  it('centres the origin at the default zoom when the board is empty', () => {
    const view = fit([], 800, 600)
    expect(view.zoom).toBe(DEFAULT_ZOOM)
    expect(worldToScreen(view, 0.5, 0.5)).toEqual([400, 300])
  })

  it('frames every live cell', () => {
    const cells: [number, number][] = [
      [-150, 5],
      [200, -50],
      [0, 120],
    ]
    const view = fit(cells, 800, 600)
    for (const [x, y] of cells) {
      const [left, top] = worldToScreen(view, x, y)
      const [right, bottom] = worldToScreen(view, x + 1, y + 1)
      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(right).toBeLessThanOrEqual(800)
      expect(bottom).toBeLessThanOrEqual(600)
    }
  })

  it('does not zoom in past the default on a small pattern', () => {
    expect(fit([[0, 0]], 800, 600).zoom).toBe(DEFAULT_ZOOM)
  })
})
