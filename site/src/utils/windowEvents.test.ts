import { describe, it, expect, vi } from 'vitest';
import { onWindowCustomEvent, emitWindowCustomEvent } from './windowEvents';

describe('windowEvents', () => {
  it('transmet le détail typé au handler abonné', () => {
    const handler = vi.fn();
    const unsubscribe = onWindowCustomEvent<number>('test-event', handler);

    emitWindowCustomEvent<number>('test-event', 42);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe(42);

    unsubscribe();
  });

  it('ne notifie plus après désabonnement', () => {
    const handler = vi.fn();
    const unsubscribe = onWindowCustomEvent('test-event', handler);

    unsubscribe();
    emitWindowCustomEvent('test-event', 1);

    expect(handler).not.toHaveBeenCalled();
  });
});
