import { renderHook, act } from '@testing-library/react'
import { SessionHeatmapProvider, useSessionHeatmap } from './SessionHeatmapContext'

describe('SessionHeatmapContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionHeatmapProvider>{children}</SessionHeatmapProvider>
  )

  it('aggregates clicks and moves without needing provider rerenders', () => {
    const { result } = renderHook(() => useSessionHeatmap(), { wrapper })

    act(() => {
      result.current.addInteraction({
        sessionId: 'session_1',
        path: '/playground',
        type: 'move',
        x: 20,
        y: 30,
        timestamp: 1,
      })
      result.current.addClick('session_1', '/playground', 25, 35)
    })

    const heatmap = result.current.getHeatmapData('/playground')

    expect(heatmap.totalInteractions).toBe(2)
    expect(heatmap.totalMoves).toBe(1)
    expect(heatmap.totalClicks).toBe(1)
    expect(heatmap.clicks).toEqual([{ x: 25, y: 35 }])
  })

  it('caps retained interactions per path at 100', () => {
    const { result } = renderHook(() => useSessionHeatmap(), { wrapper })

    act(() => {
      for (let index = 0; index < 120; index += 1) {
        result.current.addInteraction({
          sessionId: 'session_1',
          path: '/vault',
          type: 'move',
          x: index % 100,
          y: index % 100,
          timestamp: index,
        })
      }
    })

    const heatmap = result.current.getHeatmapData('/vault')

    expect(heatmap.totalInteractions).toBe(100)
  })
})
