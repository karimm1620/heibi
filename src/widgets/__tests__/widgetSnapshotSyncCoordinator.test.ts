import { createWidgetSnapshotSyncCoordinator } from "../widgetSnapshotSyncCoordinator";

describe("widget snapshot sync coordinator", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("serializes native writes and rebuilds the latest state after an in-flight change", async () => {
    let version = 1;
    let finishFirstWrite: (() => void) | undefined;
    const writes: number[] = [];
    const writeSnapshot = jest.fn((snapshot: number) => {
      writes.push(snapshot);
      if (writes.length === 1) {
        return new Promise<void>((resolve) => {
          finishFirstWrite = resolve;
        });
      }
      return Promise.resolve();
    });
    const coordinator = createWidgetSnapshotSyncCoordinator({
      delayMs: 300,
      buildSnapshot: () => version,
      writeSnapshot,
      onError: jest.fn(),
    });

    coordinator.request();
    await jest.advanceTimersByTimeAsync(300);
    expect(writes).toEqual([1]);

    version = 2;
    coordinator.request();
    await jest.advanceTimersByTimeAsync(300);
    expect(writes).toEqual([1]);

    finishFirstWrite?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(writes).toEqual([1, 2]);
  });

  it("coalesces a burst before the native write starts", async () => {
    let version = 1;
    const writes: number[] = [];
    const coordinator = createWidgetSnapshotSyncCoordinator({
      delayMs: 300,
      buildSnapshot: () => version,
      writeSnapshot: async (snapshot) => {
        writes.push(snapshot);
      },
      onError: jest.fn(),
    });

    coordinator.request();
    version = 2;
    coordinator.request();
    version = 3;
    coordinator.request();
    await jest.advanceTimersByTimeAsync(300);

    expect(writes).toEqual([3]);
  });
});
