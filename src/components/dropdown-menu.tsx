import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import {
  color,
  controlEdgeDense,
  controlSheetBlur,
  motion,
  radius,
  size,
  space,
  text,
} from '@/theme';

import { GlassUnder, glassStyle } from './glass';
import { useFloatingBlurTarget } from './screen-blur';

export type DropdownAnchor = { x: number; y: number; width: number; height: number };
export type DropdownItem = { label: string; onPress: () => void; tone?: 'destructive' };

export function DropdownMenu({
  open,
  onClose,
  anchor,
  items,
}: {
  open: boolean;
  onClose: () => void;
  anchor: DropdownAnchor | null;
  items: DropdownItem[];
}) {
  const [bounds, setBounds] = useState<DropdownAnchor | null>(null);
  const [presence, setPresence] = useState({ open, mounted: open });
  if (presence.open !== open) setPresence({ open, mounted: presence.mounted || open });
  return presence.mounted && anchor ? (
    <DropdownBody
      bounds={bounds}
      onBounds={setBounds}
      open={open}
      onClose={onClose}
      anchor={anchor}
      items={items}
      onExited={() =>
        setPresence((current) => (current.open ? current : { ...current, mounted: false }))
      }
    />
  ) : null;
}

function DropdownBody({
  open,
  onClose,
  anchor,
  items,
  onExited,
  bounds,
  onBounds,
}: {
  open: boolean;
  onClose: () => void;
  anchor: DropdownAnchor;
  items: DropdownItem[];
  onExited: () => void;
  bounds: DropdownAnchor | null;
  onBounds: (bounds: DropdownAnchor) => void;
}) {
  const [resting, setResting] = useState(false);
  const [previousOpen, setPreviousOpen] = useState(open);
  if (previousOpen !== open) {
    setPreviousOpen(open);
    setResting(false);
  }
  const target = useFloatingBlurTarget(open && resting);
  const window = useWindowDimensions();
  const overlayRef = useRef<View>(null);
  const progressSV = useSharedValue(0);
  const openSV = useSharedValue(open);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const finish = () => {
      if (openSV.get() && progressSV.get() === 1) setResting(true);
      else if (!openSV.get() && progressSV.get() === 0) onExited();
    };
    openSV.set(open);
    progressSV.set(
      withTiming(
        open ? 1 : 0,
        { duration: motion.fast, easing: Easing.bezier(0.23, 1, 0.32, 1) },
        (finished) => {
          if (finished) scheduleOnRN(finish);
        },
      ),
    );
    return () => cancelAnimation(progressSV);
  }, [open, openSV, progressSV, onExited]);

  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [open, onClose]);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: progressSV.get(),
    transform: [{ scale: reducedMotion ? 1 : 0.96 + 0.04 * progressSV.get() }],
  }));

  const containerWidth = bounds?.width ?? window.width;
  const menuWidth = Math.min(184, containerWidth - space.pad * 2);
  const right = Math.min(
    containerWidth - menuWidth - space.pad,
    Math.max(space.pad, containerWidth - (anchor.x + anchor.width - (bounds?.x ?? 0))),
  );
  const top = Math.max(space.row, anchor.y + anchor.height - (bounds?.y ?? 0) + space.row);

  return (
    <View
      ref={overlayRef}
      collapsable={false}
      pointerEvents={open ? 'box-none' : 'none'}
      onLayout={() =>
        overlayRef.current?.measureInWindow((x, y, width, height) =>
          onBounds({ x, y, width, height }),
        )
      }
      style={[StyleSheet.absoluteFill, { opacity: bounds ? 1 : 0 }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close menu"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={[
          {
            position: 'absolute',
            top,
            right,
            width: menuWidth,
            borderRadius: radius.plate,
            borderCurve: 'continuous',
            transformOrigin: 'top right',
            ...(target ? glassStyle(controlSheetBlur, controlSheetBlur.blur) : controlEdgeDense),
          },
          panelStyle,
        ]}
      >
        {target ? (
          <GlassUnder
            fadeIn
            recipe={controlSheetBlur}
            blur={controlSheetBlur.blur}
            target={target}
            radius={radius.plate}
          />
        ) : null}
        <View style={{ borderRadius: radius.plate, overflow: 'hidden', paddingVertical: 4 }}>
          {items.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              onPress={() => {
                onClose();
                item.onPress();
              }}
              style={({ pressed }) => ({
                minHeight: size.hit,
                justifyContent: 'center',
                paddingHorizontal: space.within,
                paddingVertical: space.row,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={[
                  text.rowName,
                  { color: item.tone === 'destructive' ? color.live : color.hi },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
