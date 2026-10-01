import {
  createContext,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { View } from 'react-native';

import { useGlassTrial } from '@/data/glass-trial';

type RegisterBlurTarget = (target: RefObject<View | null>) => () => void;
const ScreenBlurRegistrationContext = createContext<RegisterBlurTarget | null>(null);
export const ScreenBlurTargetContext = createContext<RefObject<View | null> | null>(null);
const SheetOpenRegistrationContext = createContext<(() => () => void) | null>(null);
const SheetOpenContext = createContext(false);

export function ScreenBlurProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<RefObject<View | null> | null>(null);
  const [openSheetCount, setOpenSheetCount] = useState(0);
  const registerSheetOpen = useCallback(() => {
    setOpenSheetCount((count) => count + 1);
    return () => setOpenSheetCount((count) => count - 1);
  }, []);
  const registerTarget = useCallback((next: RefObject<View | null>) => {
    setTarget(next);
    return () => setTarget((current) => (current === next ? null : current));
  }, []);
  return (
    <ScreenBlurRegistrationContext.Provider value={registerTarget}>
      <ScreenBlurTargetContext.Provider value={target}>
        <SheetOpenRegistrationContext.Provider value={registerSheetOpen}>
          <SheetOpenContext.Provider value={openSheetCount > 0}>
            {children}
          </SheetOpenContext.Provider>
        </SheetOpenRegistrationContext.Provider>
      </ScreenBlurTargetContext.Provider>
    </ScreenBlurRegistrationContext.Provider>
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
