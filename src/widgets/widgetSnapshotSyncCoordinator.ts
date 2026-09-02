export interface WidgetSnapshotSyncCoordinatorOptions<T> {
  buildSnapshot: () => T;
  delayMs: number;
  onError: (error: unknown) => void;
  writeSnapshot: (snapshot: T) => Promise<void>;
}

/**
 * Debounces store bursts and serializes native writes. If state changes while
 * a write is in flight, exactly one follow-up write rebuilds from the latest
 * store state so an older asynchronous write can never become the final file.
 */
export function createWidgetSnapshotSyncCoordinator<T>({
  buildSnapshot,
  delayMs,
  onError,
  writeSnapshot,
}: WidgetSnapshotSyncCoordinatorOptions<T>) {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let writeInFlight = false;
  let followUpRequired = false;

  const flush = async () => {
    if (writeInFlight) {
      followUpRequired = true;
      return;
    }

    writeInFlight = true;
    try {
      do {
        followUpRequired = false;
        try {
          await writeSnapshot(buildSnapshot());
        } catch (error) {
          onError(error);
        }
      } while (followUpRequired);
    } finally {
      writeInFlight = false;
    }
  };

  const request = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      void flush();
    }, delayMs);
  };

  return { flush, request };
}
