import { type NativeModule, requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

export interface LiveRestOptions {
  title: string;
  lines: string[];
  rest?: { startMs: number; endMs: number; key?: string };
}

export interface RestAction {
  type: 'minus' | 'plus' | 'skip';
}

type LiveRestEvents = { onRestAction: (action: RestAction) => void };

declare class LiveRestModule extends NativeModule<LiveRestEvents> {
  show(options: LiveRestOptions): Promise<void>;
  hide(): Promise<void>;
  consumeRestActions(): Promise<RestAction[]>;
}

export default Platform.OS === 'android'
  ? requireOptionalNativeModule<LiveRestModule>('LiveRest')
  : null;
