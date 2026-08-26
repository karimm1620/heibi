import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

interface UseDragReorderOptions<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  onReorderCommit: (newItems: T[]) => Promise<void> | void;
}

export interface DragReorderController {
  activeIndex: SharedValue<number>;
  targetIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  onDragStart: (key: string) => void;
  onDragDrop: (key: string, targetIndex: number) => void;
  onDragCancel: () => void;
}

/**
 * Controller drag-reorder yang sengaja cuma melakukan kerja per-frame di UI
 * thread (lihat `DragReorderRow`). `draggingKey` cuma toggle di boundary
 * gesture; urutan React + SQLite baru diubah sekali setelah card settle.
 *
 * `SwipeableRow` klasik tetap gak disentuh: drag dipasang cuma di handle
 * terpisah lewat RNGH Gesture API, jadi horizontal swipe dan vertical reorder
 * gak berbagi touch target.
 */
export function useDragReorder<T>({
  items,
  keyExtractor,
  onReorderCommit,
}: UseDragReorderOptions<T>) {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragSnapshot, setDragSnapshot] = useState<T[] | null>(null);
  const dragSnapshotRef = useRef(items);
  const keyExtractorRef = useRef(keyExtractor);
  const onReorderCommitRef = useRef(onReorderCommit);

  const activeIndex = useSharedValue(-1);
  const targetIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);

  // List yang kelihatan saat drag dibekukan sekali di gesture boundary.
  // Jadi parent/store boleh re-render tanpa menggeser base index yang sedang
  // dipakai shared values di UI thread. Tidak perlu sinkronisasi setState
  // lewat effect (React 19 juga sengaja melarang pola itu).

  useEffect(() => {
    keyExtractorRef.current = keyExtractor;
  }, [keyExtractor]);

  useEffect(() => {
    onReorderCommitRef.current = onReorderCommit;
  }, [onReorderCommit]);

  const resetDragState = useCallback(() => {
    activeIndex.set(-1);
    targetIndex.set(-1);
    dragY.set(0);
    setDraggingKey(null);
    setDragSnapshot(null);
  }, [activeIndex, dragY, targetIndex]);

  const onDragStart = useCallback(
    (key: string) => {
      // Snapshot + ref diisi di event handler yang sama supaya drop selalu
      // membaca urutan yang PERSIS dipakai saat gesture mulai, bahkan kalau
      // React belum sempat commit render berikutnya.
      dragSnapshotRef.current = items;
      setDragSnapshot(items);
      setDraggingKey(key);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    },
    [items],
  );

  const onDragDrop = useCallback(
    (key: string, requestedTargetIndex: number) => {
      void (async () => {
        const currentItems = dragSnapshotRef.current;
        const extractor = keyExtractorRef.current;
        const sourceIndex = currentItems.findIndex((item) => extractor(item) === key);

        if (sourceIndex < 0 || currentItems.length === 0) {
          resetDragState();
          return;
        }

        const clampedTargetIndex = Math.min(
          Math.max(requestedTargetIndex, 0),
          currentItems.length - 1,
        );

        if (sourceIndex === clampedTargetIndex) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          resetDragState();
          return;
        }

        const next = [...currentItems];
        const [moved] = next.splice(sourceIndex, 1);
        next.splice(clampedTargetIndex, 0, moved);

        try {
          // Store heibi write-through: SQLite selesai dulu, baru Zustand
          // update. Sampai Promise ini resolve, shared values UI tetap nahan
          // card di slot tujuan supaya gak snap balik saat DB lagi nulis.
          await onReorderCommitRef.current(next);
          // Store sudah sukses + parent sekarang memegang urutan baru. Snapshot
          // lokal tetap dipakai sampai finally reset shared state, jadi layout
          // baru gak pernah ketemu activeIndex lama di tengah transisi.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        } catch {
          // Persistence gagal: jangan biarkan gesture nyangkut / promise
          // rejection bocor. Reset visual ke urutan store yang masih valid.
        } finally {
          resetDragState();
        }
      })();
    },
    [resetDragState],
  );

  const onDragCancel = useCallback(() => {
    resetDragState();
  }, [resetDragState]);

  const controller = useMemo<DragReorderController>(
    () => ({
      activeIndex,
      targetIndex,
      dragY,
      onDragStart,
      onDragDrop,
      onDragCancel,
    }),
    [activeIndex, dragY, onDragCancel, onDragDrop, onDragStart, targetIndex],
  );

  // Saat idle, render langsung dari source-of-truth parent/store. Saat drag,
  // render snapshot awal gesture; perpindahan per-frame tetap sepenuhnya
  // transform di `DragReorderRow`, tanpa setState dari `onUpdate`.
  const order = draggingKey === null ? items : (dragSnapshot ?? items);

  return { order, draggingKey, controller };
}

/**
 * Reinterleave hasil reorder dari SUBSET (misal "habit yang due hari ini")
 * balik ke LIST PENUH, tanpa ngerusak posisi relatif item yang gak keliatan
 * di subset itu (misal habit yang cuma due hari lain). Item yang ADA di
 * subset digantiin urutan barunya (`reorderedSubset`, sequential), item yang
 * GAK ada di subset tetap di slot relatifnya masing-masing.
 *
 * Perlu ini karena Today screen cuma nampilin habit yang due HARI INI (subset
 * dari semua habit) — drag-reorder di situ gak boleh nulis ulang sort_order
 * cuma buat subset itu doang (bakal nabrak/nyisain gap sama habit yang lagi
 * gak keliatan).
 */
export function mergeReorderedSubsetIntoFullList<T>(
  fullList: T[],
  keyExtractor: (item: T) => string,
  reorderedSubset: T[],
): T[] {
  const subsetIds = new Set(reorderedSubset.map(keyExtractor));
  let subsetCursor = 0;
  return fullList.map((item) =>
    subsetIds.has(keyExtractor(item)) ? reorderedSubset[subsetCursor++] : item,
  );
}
