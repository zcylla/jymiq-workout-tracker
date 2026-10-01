import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const base = config as ExpoConfig;
  if (process.env.APP_VARIANT !== 'development') return base;

  return {
    ...base,
    name: 'Jymiq Dev',
    scheme: 'jymiqdev',
    icon: './assets/images/dev/icon.png',
    android: {
      ...base.android,
      package: 'com.zcylla.jymiq.dev',
      adaptiveIcon: {
        ...base.android?.adaptiveIcon,
        foregroundImage: './assets/images/dev/android-icon-foreground.png',
        monochromeImage: './assets/images/dev/android-icon-monochrome.png',
      },
    },
  };
};
