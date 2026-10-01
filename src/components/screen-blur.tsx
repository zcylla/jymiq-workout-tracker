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

export function ScreenBlurProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<RefObject<View | null> | null>(null);
  const registerTarget = useCallback((next: RefObject<View | null>) => {
    setTarget(next);
    return () => setTarget((current) => (current === next ? null : current));
  }, []);
  return (
    <ScreenBlurRegistrationContext.Provider value={registerTarget}>
      <ScreenBlurTargetContext.Provider value={target}>{children}</ScreenBlurTargetContext.Provider>
    </ScreenBlurRegistrationContext.Provider>
  );
}

export function useScreenBlurRegistration() {
  return useContext(ScreenBlurRegistrationContext);
}

/** Screen children shadow this target with null to prevent a blur inside its own target. */
export function useScreenBlurTarget() {
  const target = useContext(ScreenBlurTargetContext);
  const trial = useGlassTrial();
  return trial.style !== 'off' && trial.scope !== 'off' ? target : null;
}
