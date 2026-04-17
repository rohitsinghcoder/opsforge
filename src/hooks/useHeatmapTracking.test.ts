import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useHeatmapTracking } from './useHeatmapTracking';
import * as convexReact from 'convex/react';
import * as SessionHeatmapContext from '../contexts/SessionHeatmapContext';

// Mock dependencies
vi.mock('convex/react', () => ({
  useMutation: vi.fn(),
}));

vi.mock('../contexts/SessionHeatmapContext', () => ({
  useSessionHeatmap: vi.fn(),
}));

vi.mock('../utils/clientIdentity', () => ({
  getOrCreateSessionId: () => 'mock-session-id',
}));

describe('useHeatmapTracking', () => {
  let mockStoreBatch: ReturnType<typeof vi.fn>;
  let mockStoreClick: ReturnType<typeof vi.fn>;
  let mockAddInteraction: ReturnType<typeof vi.fn>;
  let mockAddClick: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockStoreBatch = vi.fn().mockResolvedValue({ stored: true, count: 1 });
    mockStoreClick = vi.fn().mockResolvedValue({ stored: true });
    
    vi.spyOn(convexReact, 'useMutation')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValueOnce(mockStoreBatch as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockReturnValueOnce(mockStoreClick as any);

    mockAddInteraction = vi.fn();
    mockAddClick = vi.fn();
    vi.spyOn(SessionHeatmapContext, 'useSessionHeatmap').mockReturnValue({
      addInteraction: mockAddInteraction,
      addClick: mockAddClick,
      interactions: [],
      clicks: [],
      sessionLimitReached: false,
    } as unknown as ReturnType<typeof SessionHeatmapContext.useSessionHeatmap>);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('throttles mouse move events and flushes batch', async () => {
    const { unmount } = renderHook(() => useHeatmapTracking('/test-path'));

    // Trigger first mouse move
    act(() => {
      const event = new MouseEvent('mousemove', { clientX: 100, clientY: 100 });
      window.dispatchEvent(event);
    });

    expect(mockAddInteraction).toHaveBeenCalledTimes(1);
    
    // Trigger second mouse move immediately (should be throttled)
    act(() => {
      const event = new MouseEvent('mousemove', { clientX: 200, clientY: 200 });
      window.dispatchEvent(event);
    });
    
    expect(mockAddInteraction).toHaveBeenCalledTimes(1);

    // Advance time past throttle and move again
    act(() => {
      vi.advanceTimersByTime(1100);
      const event = new MouseEvent('mousemove', { clientX: 500, clientY: 500 });
      window.dispatchEvent(event);
    });

    expect(mockAddInteraction).toHaveBeenCalledTimes(2);

    // Advance time past flush delay to trigger batch save
    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    expect(mockStoreBatch).toHaveBeenCalledTimes(1);
    expect(mockStoreBatch).toHaveBeenCalledWith(expect.objectContaining({
      interactions: expect.any(Array)
    }));

    unmount();
  });

  it('stops tracking when session limit is reached', async () => {
    mockStoreBatch.mockResolvedValueOnce({ reason: 'session_limit_reached', stored: false });

    const { unmount } = renderHook(() => useHeatmapTracking('/test-path'));

    // Trigger move and flush to get the session_limit_reached response
    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));
    });

    await act(async () => {
      vi.advanceTimersByTime(1600); // Trigger flush
    });

    expect(mockStoreBatch).toHaveBeenCalledTimes(1);

    // Move again, it should add to context but NOT call storeBatch anymore
    act(() => {
      vi.advanceTimersByTime(1100);
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 200 }));
    });

    await act(async () => {
      vi.advanceTimersByTime(1600);
    });

    // Still 1 because session limit reached flag is true
    expect(mockStoreBatch).toHaveBeenCalledTimes(1);

    unmount();
  });
});