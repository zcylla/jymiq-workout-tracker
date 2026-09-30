import { type ReactNode, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { chromeShadow, color, motion, radius } from '@/theme';

import { gestureStart } from './haptics';
import { Grip } from './icon';

type Item = { id: string };

type Props<T extends Item> = {
  items: readonly T[];
  /** Every row is exactly this tall — the slots the drag snaps between. */
  rowHeight: number;
  /** Space between rows, for plates that are not flush. */
  gap?: number;
  /** Omitted, nothing is draggable and `renderRow` gets no handle. */
  onReorder?: (fromIndex: number, toIndex: number) => void;
  /** Place `handle` as the row's first child; it is null when reordering is off. */
  renderRow: (item: T, index: number, handle: ReactNode) => ReactNode;
};

const LIFT_SCALE = 1.03;
export const HANDLE_WIDTH = 36;

/**
 * Rows of one fixed height that reorder by dragging their grip. Every row is
 * absolutely placed from a shared order array, so a drag only rewrites that
 * array and the siblings slide to their new slots on the UI thread. The
 * callback fires once, on drop.
 */
export function ReorderList<T extends Item>({
  items,
  rowHeight,
  gap = 0,
  onReorder,
  renderRow,
}: Props<T>) {
  if (!onReorder) {
    return <View style={{ gap }}>{items.map((item, i) => renderRow(item, i, null))}</View>;
  }
  return (
    <Sortable
      items={items}
      rowHeight={rowHeight}
      gap={gap}
      onReorder={onReorder}
      renderRow={renderRow}
    />
  );
}

function Sortable<T extends Item>({
  items,
  rowHeight,
  gap = 0,
  onReorder,
  renderRow,
}: Props<T> & { onReorder: (from: number, to: number) => void }) {
  const pitch = rowHeight + gap;
  const orderSV = useSharedValue(items.map((i) => i.id));
  const activeIdSV = useSharedValue<string | null>(null);
  const dragTopSV = useSharedValue(0);

  const key = items.map((i) => i.id).join('|');
  useEffect(() => {
    orderSV.set(key ? key.split('|') : []);
  }, [key, orderSV]);

  return (
    <View style={{ height: Math.max(0, items.length * pitch - gap) }}>
      {items.map((item, i) => (
        <SortRow
          key={item.id}
          id={item.id}
          index={i}
          rowHeight={rowHeight}
          pitch={pitch}
          orderSV={orderSV}
          activeIdSV={activeIdSV}
          dragTopSV={dragTopSV}
          onReorder={onReorder}
        >
          {(handle) => renderRow(item, i, handle)}
        </SortRow>
      ))}
    </View>
  );
}

function SortRow({
  id,
  index,
  rowHeight,
  pitch,
  orderSV,
  activeIdSV,
  dragTopSV,
  onReorder,
  children,
}: {
  id: string;
  index: number;
  rowHeight: number;
  pitch: number;
  orderSV: SharedValue<string[]>;
  activeIdSV: SharedValue<string | null>;
  dragTopSV: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  children: (handle: ReactNode) => ReactNode;
}) {
  const fromSV = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetY([-5, 5])
    .failOffsetX([-12, 12])
    .hitSlop({ left: 8, right: 4 })
    .onStart(() => {
      const from = orderSV.get().indexOf(id);
      fromSV.set(from);
      dragTopSV.set(from * pitch);
      activeIdSV.set(id);
      scheduleOnRN(gestureStart);
    })
    .onUpdate((event) => {
      const order = orderSV.get();
      const top = Math.min(
        Math.max(fromSV.get() * pitch + event.translationY, 0),
        (order.length - 1) * pitch,
      );
      dragTopSV.set(top);
      const target = Math.round(top / pitch);
      if (target !== order.indexOf(id)) {
        const next = order.filter((x) => x !== id);
        next.splice(target, 0, id);
        orderSV.set(next);
      }
    })
    .onFinalize((_event, success) => {
      if (activeIdSV.get() !== id) return;
      const from = fromSV.get();
      const order = orderSV.get();
      const to = order.indexOf(id);
      activeIdSV.set(null);
      if (!success) {
        const back = order.filter((x) => x !== id);
        back.splice(from, 0, id);
        orderSV.set(back);
      } else if (to !== from) {
        scheduleOnRN(onReorder, from, to);
      }
    });

  const rowStyle = useAnimatedStyle(() => {
    const active = activeIdSV.get() === id;
    const at = orderSV.get().indexOf(id);
    const slot = (at < 0 ? index : at) * pitch;
    return {
      zIndex: active ? 10 : 0,
      transform: [
        { translateY: active ? dragTopSV.get() : withTiming(slot, { duration: motion.fast }) },
        { scale: withTiming(active ? LIFT_SCALE : 1, { duration: motion.fast }) },
      ],
    };
  });
  const liftStyle = useAnimatedStyle(() => ({
    opacity: withTiming(activeIdSV.get() === id ? 1 : 0, { duration: motion.fast }),
  }));

  const handle = (
    <GestureDetector gesture={pan}>
      <View
        accessibilityLabel="Reorder"
        style={{
          width: HANDLE_WIDTH,
          height: rowHeight,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Grip />
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: rowHeight }, rowStyle]}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          liftStyle,
          { borderRadius: radius.row, backgroundColor: color.raised, boxShadow: chromeShadow },
        ]}
      />
      {children(handle)}
    </Animated.View>
  );
}
