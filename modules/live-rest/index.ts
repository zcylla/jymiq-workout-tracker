import { type NativeModule, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export interface LiveRestOptions {
  title: string;
  lines: string[];
  rest?: { startMs: number; endMs: number };
}

declare class LiveRestModule extends NativeModule {
  show(options: LiveRestOptions): Promise<void>;
  hide(): Promise<void>;
}

export default Platform.OS === 'android'
  ? requireOptionalNativeModule<LiveRestModule>('LiveRest')
  : null;
