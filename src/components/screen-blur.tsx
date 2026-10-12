import { useIsFocused } from 'expo-router';
import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  useSyncExternalStore,
} from 'react';
import { Platform, type View } from 'react-native';
import { cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useGlassTrial } from '@/data/glass-trial';
import { motion } from '@/theme';

type RegisterBlurTarget = (target: RefObject<View | null>) => () => void;
const ScreenBlurRegistrationContext = createContext<RegisterBlurTarget | null>(null);
export const ScreenBlurTargetContext = createContext<RefObject<View | null> | null>(null);
const SheetOpenRegistrationContext = createContext<(() => () => void) | null>(null);
const SheetOpenContext = createContext(false);

function createMotionSignal() {
  const transitions = new Set<string>();
  const listeners = new Set<() => void>();
  let focusEpoch = 0;
  let settledEpoch = 0;
  const emit = () => listeners.forEach((listener) => listener());
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    moving: () => transitions.size > 0 || focusEpoch !== settledEpoch,
    focusEpoch: () => focusEpoch,
    focusChanged: () => {
      if (Platform.OS !== 'android') return;
      focusEpoch += 1;
      emit();
    },
    focusSettled: (epoch: number) => {
      if (epoch !== focusEpoch) return;
      settledEpoch = epoch;
      emit();
    },
    transition: (key: string, moving: boolean) => {
      if (Platform.OS !== 'android') return;
      if (moving) transitions.add(key);
      else transitions.delete(key);
      emit();
    },
    clearStack: (prefix: string) => {
      for (const key of transitions) if (key.startsWith(prefix)) transitions.delete(key);
      emit();
    },
  };
}

const ScreenMotionContext = createContext<ReturnType<typeof createMotionSignal> | null>(null);
const noSubscribe = () => () => {};
const atRest = () => false;

export function useScreenMotion() {
  const signal = useContext(ScreenMotionContext);
  return useSyncExternalStore(signal?.subscribe ?? noSubscribe, signal?.moving ?? atRest);
}

export function useFloatingBlurTarget(atRest = true) {
  const target = useScreenBlurTarget();
  const moving = useScreenMotion();
  const focused = useIsFocused();
  return Platform.OS !== 'android' || (atRest && !moving && focused) ? target : null;
}

export function useStackBlurMotionListeners() {
  const signal = useContext(ScreenMotionContext);
  const id = useId();
  const prefix = `${id}:`;
  useEffect(() => () => signal?.clearStack(prefix), [signal, prefix]);
  return {
    transitionStart: (event: { target?: string }) =>
      signal?.transition(`${prefix}${event.target}`, true),
    transitionEnd: (event: { target?: string }) =>
      signal?.transition(`${prefix}${event.target}`, false),
    gestureCancel: (event: { target?: string }) =>
      signal?.transition(`${prefix}${event.target}`, false),
  };
}

export function useTabBlurMotionListeners() {
  const signal = useContext(ScreenMotionContext);
  return { focus: () => signal?.focusChanged() };
}

export function ScreenBlurProvider({ children }: { children: ReactNode }) {
  const [signal] = useState(createMotionSignal);
  const epoch = useSyncExternalStore(signal.subscribe, signal.focusEpoch);
  const focusSV = useSharedValue(1);
  useEffect(() => {
    if (Platform.OS !== 'android' || epoch === 0) return;
    focusSV.set(0);
    focusSV.set(
      withTiming(1, { duration: motion.fast }, (finished) => {
        if (finished) scheduleOnRN(signal.focusSettled, epoch);
      }),
    );
    return () => cancelAnimation(focusSV);
  }, [epoch, focusSV, signal]);
  const [target, setTarget] = useState<RefObject<View | null> | null>(null);
  const [openSheetCount, setOpenSheetCount] = useState(0);
  const registerSheetOpen = useCallback(() => {
    setOpenSheetCount((count) => count + 1);
    return () => setOpenSheetCount((count) => count - 1);
  }, []);
  const registerTarget = useCallback(
    (next: RefObject<View | null>) => {
      signal.focusChanged();
      setTarget(next);
      return () => setTarget((current) => (current === next ? null : current));
    },
    [signal],
  );
  return (
    <ScreenMotionContext.Provider value={signal}>
      <ScreenBlurRegistrationContext.Provider value={registerTarget}>
        <ScreenBlurTargetContext.Provider value={target}>
          <SheetOpenRegistrationContext.Provider value={registerSheetOpen}>
            <SheetOpenContext.Provider value={openSheetCount > 0}>
              {children}
            </SheetOpenContext.Provider>
          </SheetOpenRegistrationContext.Provider>
        </ScreenBlurTargetContext.Provider>
      </ScreenBlurRegistrationContext.Provider>
    </ScreenMotionContext.Provider>
  );
}

export function useScreenBlurRegistration() {
  return useContext(ScreenBlurRegistrationContext);
}

export function useSheetOpenRegistration() {
  return useContext(SheetOpenRegistrationContext);
}

export function useSheetOpen() {
  return useContext(SheetOpenContext);
}

/** Screen children shadow this target with null to prevent a blur inside its own target. */
export function useScreenBlurTarget() {
  const target = useContext(ScreenBlurTargetContext);
  const trial = useGlassTrial();
  return trial.style !== 'off' && trial.scope !== 'off' ? target : null;
}
