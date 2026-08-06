import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, PanResponder } from "react-native";

const LONG_PRESS_DURATION_MS = 350;
const MOVE_CANCEL_THRESHOLD = 8;

interface UseDragReorderOptions<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  /** Tinggi SERAGAM tiap item (termasuk margin/gap) — dipakai buat kalkulasi kapan posisi ke-swap. */
  itemHeight: number;
  onReorderCommit: (newItems: T[]) => void;
}

/**
 * Long-press + drag buat reorder list, dipicu dari HANDLE terpisah (bukan
 * seluruh card) — item card di app ini (`GoalCard`/`HabitRow`) udah dibungkus
 * `SwipeableRow` (swipe kiri/kanan) dari Checkpoint 2b, jadi drag vertikal
 * TIDAK bisa dipasang di touch area yang sama tanpa rebutan gesture sama
 * Swipeable punya PanResponder sendiri. Handle kecil terpisah = gak ada
 * konflik gesture sama sekali, dan gak perlu Reanimated (app ini emang gak
 * pakai Reanimated — lihat PROJECT_CONTEXT.md).
 *
 * Cara pakai: attach `getHandlePanResponder(item).panHandlers` ke View kecil
 * (drag handle icon) di tiap row, render `order` (bukan `items` asli) buat
 * urutan yang lagi di-drag keliatan real-time, dan style row yang lagi
 * di-drag pakai `draggingKey`+`dragY` biar ngambang ikutin jari.
 */
export function useDragReorder<T>({
  items,
  keyExtractor,
  itemHeight,
  onReorderCommit,
}: UseDragReorderOptions<T>) {
  const [order, setOrder] = useState(items);
  const orderRef = useRef(order);
  // Checkpoint 9: dulu ditulis langsung di body render (`orderRef.current =
  // order`), kena react-hooks/refs. `orderRef` cuma dibaca di dalam
  // PanResponder callback (event handler), jadi sinkroninnya aman dipindah
  // ke useEffect -- commit dulu baru ke-update, gak beda perilaku wong
  // callback-nya toh baru jalan belakangan pas user narik gesture.
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const draggingKeyRef = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  // Checkpoint 9: useState(() => ...) gantiin useRef(...).current.
  const [dragY] = useState(() => new Animated.Value(0));
  const startIndexRef = useRef(0);
  const currentIndexRef = useRef(0);

  // Checkpoint <next>: `itemHeight`/`onReorderCommit` dibaca lewat ref, BUKAN
  // di-closure langsung sama PanResponder callback -- alasannya nyambung ke
  // cache di bawah (`panResponderCacheRef`): kalau closure-nya baca prop
  // langsung, cache yang sengaja DIPERTAHANKAN antar render bakal ke-stuck
  // pegang nilai lama pas prop ini berubah. Baca dari `.current` selalu
  // dapet nilai TERBARU walau PanResponder instance-nya gak pernah dibikin
  // ulang.
  const itemHeightRef = useRef(itemHeight);
  useEffect(() => {
    itemHeightRef.current = itemHeight;
  }, [itemHeight]);
  const onReorderCommitRef = useRef(onReorderCommit);
  useEffect(() => {
    onReorderCommitRef.current = onReorderCommit;
  }, [onReorderCommit]);

  // Sinkron urutan dari props MASUK ke state lokal — tapi JANGAN pas lagi
  // proses drag, biar urutan yang lagi digeser gak "ketimpa" balik data lama
  // dari parent yang belum sempat ke-refresh (race antara reorder lokal vs
  // prop yang baru nyusul update).
  useEffect(() => {
    if (draggingKeyRef.current === null) {
      setOrder(items);
    }
  }, [items]);

  // Checkpoint <next> — FIX BUG UTAMA drag-reorder yang lag & "nyangkut":
  // dulu `getHandlePanResponder(item)` manggil `PanResponder.create(...)`
  // BARU setiap kali dipanggil, dan dipanggil LANGSUNG di JSX pas render
  // tiap row (`{...getHandlePanResponder(item).panHandlers}`). Karena
  // `onPanResponderMove` di bawah motret `setOrder(...)` SETIAP kali index
  // geser, parent re-render di TENGAH-TENGAH gesture yang masih jalan --
  // artinya row yang lagi di-drag dapet PanResponder instance BARU sementara
  // native side masih megang instance LAMA sebagai responder aktif. Itu yang
  // bikin gesture keliatan macet/nyangkut (native kebingungan pegang
  // instance mana), belum lagi overhead bikin `PanResponder.create()` ulang
  // buat SEMUA row (bukan cuma yang di-drag) di SETIAP frame gesture.
  //
  // Fix: cache satu PanResponder PER KEY di ref (bukan state -- gak boleh
  // trigger render sendiri), jadi instance-nya TETAP SAMA sepanjang hidup
  // key itu, mau parent re-render berapa kali pun.
  const panResponderCacheRef = useRef(new Map<string, ReturnType<typeof PanResponder.create>>());

  const getHandlePanResponder = useCallback(
    (item: T) => {
      const key = keyExtractor(item);
      const cached = panResponderCacheRef.current.get(key);
      if (cached) return cached;

      const timerState = { timer: null as ReturnType<typeof setTimeout> | null, activated: false };

      const responder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => !timerState.activated,
        onPanResponderGrant: () => {
          timerState.activated = false;
          timerState.timer = setTimeout(() => {
            timerState.activated = true;
            startIndexRef.current = orderRef.current.findIndex(
              (it) => keyExtractor(it) === key,
            );
            currentIndexRef.current = startIndexRef.current;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            // Checkpoint <next> -- FIX BUG "tiba-tiba pindah posisi pas gak
            // sengaja kepencet": dulu `draggingKeyRef.current = key` +
            // `setDraggingKey(key)` langsung dipanggil DI SINI, begitu timer
            // long-press 350ms nyala -- PADAHAL jari belum tentu digeser
            // sama sekali. `renderOrder` di goals.tsx/index.tsx mindahin
            // item yang `draggingKey`-nya cocok ke urutan RENDER paling
            // akhir SEKETIKA `draggingKey` keisi, jadi long-press-lepas
            // tanpa gerakan pun bikin item keliatan "lompat" ke bawah
            // sesaat sebelum balik lagi pas jari diangkat. Fix: JANGAN
            // masuk mode dragging visual di sini, tunda sampai gerakan
            // PERTAMA beneran kejadian di `onPanResponderMove` (lihat di
            // bawah) -- kalau ternyata gak pernah gerak (nekan-lepas doang),
            // `draggingKey` gak pernah keisi sama sekali, gak ada lompatan.
          }, LONG_PRESS_DURATION_MS);
        },
        onPanResponderMove: (_, gesture) => {
          if (!timerState.activated) {
            if (
              Math.abs(gesture.dy) > MOVE_CANCEL_THRESHOLD ||
              Math.abs(gesture.dx) > MOVE_CANCEL_THRESHOLD
            ) {
              if (timerState.timer) clearTimeout(timerState.timer);
            }
            return;
          }

          if (draggingKeyRef.current !== key) {
            // Gerakan PERTAMA abis long-press ke-aktivasi -- baru sekarang
            // resmi masuk mode dragging visual (lihat komentar di atas).
            draggingKeyRef.current = key;
            setDraggingKey(key);
          }

          dragY.setValue(gesture.dy);

          const shift = Math.round(gesture.dy / itemHeightRef.current);
          const newIndex = Math.min(
            Math.max(startIndexRef.current + shift, 0),
            orderRef.current.length - 1,
          );
          if (newIndex !== currentIndexRef.current) {
            const next = [...orderRef.current];
            const [moved] = next.splice(currentIndexRef.current, 1);
            next.splice(newIndex, 0, moved);
            currentIndexRef.current = newIndex;
            setOrder(next);
          }
        },
        onPanResponderRelease: () => {
          if (timerState.timer) clearTimeout(timerState.timer);
          if (timerState.activated && draggingKeyRef.current === key) {
            // Kondisi kedua (`draggingKeyRef.current === key`) SENGAJA
            // ditambah -- kalau timer sempet aktif tapi jari gak pernah
            // gerak (draggingKey gak pernah keisi lewat onPanResponderMove
            // di atas), gak ada apa-apa yang perlu di-commit/reset.
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            draggingKeyRef.current = null;
            setDraggingKey(null);
            dragY.setValue(0);
            onReorderCommitRef.current(orderRef.current);
          }
          timerState.activated = false;
        },
        onPanResponderTerminate: () => {
          if (timerState.timer) clearTimeout(timerState.timer);
          timerState.activated = false;
          if (draggingKeyRef.current === key) {
            draggingKeyRef.current = null;
            setDraggingKey(null);
            dragY.setValue(0);
          }
        },
      });

      panResponderCacheRef.current.set(key, responder);
      return responder;
    },
    // Sengaja CUMA `keyExtractor`+`dragY` -- `itemHeight`/`onReorderCommit`
    // dibaca lewat ref (lihat di atas), BUKAN dependency di sini, justru
    // supaya cache di atas gak perlu di-invalidate tiap prop itu berubah.
    [keyExtractor, dragY],
  );

  // Buang entry cache buat key yang item-nya udah gak ada (ke-delete) --
  // biar Map ini gak numpuk terus tanpa batas sepanjang umur komponen.
  useEffect(() => {
    const validKeys = new Set(items.map(keyExtractor));
    for (const key of panResponderCacheRef.current.keys()) {
      if (!validKeys.has(key)) {
        panResponderCacheRef.current.delete(key);
      }
    }
  }, [items, keyExtractor]);

  return { order, draggingKey, dragY, getHandlePanResponder };
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
