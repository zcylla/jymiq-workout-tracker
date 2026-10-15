import type { IconName } from './icon-sizes';

export const connectors = {
  healthConnect: { title: 'Health Connect', icon: 'health' },
} as const satisfies Record<string, { title: string; icon: IconName }>;
