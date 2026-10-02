import ArrowDataTransferHorizontalIcon from '@hugeicons/core-free-icons/ArrowDataTransferHorizontalIcon';
import ArrowDown02Icon from '@hugeicons/core-free-icons/ArrowDown02Icon';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowUp02Icon from '@hugeicons/core-free-icons/ArrowUp02Icon';
import Calendar04Icon from '@hugeicons/core-free-icons/Calendar04Icon';
import ChartColumnIcon from '@hugeicons/core-free-icons/ChartColumnIcon';
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon';
import Dumbbell01Icon from '@hugeicons/core-free-icons/Dumbbell01Icon';
import FileTextIcon from '@hugeicons/core-free-icons/FileTextIcon';
import HistoryIcon from '@hugeicons/core-free-icons/HistoryIcon';
import MoreVerticalCircle01Icon from '@hugeicons/core-free-icons/MoreVerticalCircle01Icon';
import PlusSignIcon from '@hugeicons/core-free-icons/PlusSignIcon';
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon';
import TrendingUpIcon from '@hugeicons/core-free-icons/TrendingUpIcon';
import type { IconSvgElement } from '@hugeicons/react-native';

import type { IconName } from './icon-sizes';

export const ICON_MAP = {
  today: Clock01Icon,
  session: Dumbbell01Icon,
  strength: TrendingUpIcon,
  load: ChartColumnIcon,
  search: Search01Icon,
  gear: Settings01Icon,
  back: ArrowLeft01Icon,
  plus: PlusSignIcon,
  cal: Calendar04Icon,
  dots: MoreVerticalCircle01Icon,
  start: PlusSignIcon,
  hist: HistoryIcon,
  stat: ChartColumnIcon,
  note: FileTextIcon,
  swap: ArrowDataTransferHorizontalIcon,
  chev: ArrowRight01Icon,
  up: ArrowUp02Icon,
  down: ArrowDown02Icon,
} as const satisfies Record<IconName, IconSvgElement>;
