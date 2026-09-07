import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { color, size, text } from '@/theme';

import { Chevron, Grip } from './icon';

type Props = {
  title: string;
  /** kit's numbered gutter — the position column on a routine's lifts. */
  lead?: string;
  /**
   * A leading illustration — the library's exercise art. Tinted at render time
   * rather than edited: the source files are CC BY-SA and must stay unmodified.
   */
  art?: number;
  /** 15px/400 instead of 17px/500 — a secondary row, like a template to copy. */
  quiet?: boolean;
  /** The mono line under the title. */
  meta?: string;
  /** A mono caption over the value; alone, it becomes the whole right side. */
  valueLabel?: string;
  value?: string;
  /** The value is dim rather than mid — "never", an absent date. */
  valueDim?: boolean;
  /** Replaces the label/value stack entirely — a Pill, usually. */
  right?: ReactNode;
  grip?: boolean;
  chevron?: boolean;
  /** Out of the program, off the plan — present but not in play. */
  dim?: boolean;
  /** A read-only table row is 34pt: the 44pt floor is for targets, not for text. */
  readOnly?: boolean;
};

/** The gap kit puts between the right-hand value and the chevron. */
const VALUE_GAP = 10;

/** kit's numbered gutter on a lift row. */
const LEAD_WIDTH = 20;

/**
 * The art is the reason the library row exists in this shape, so it sets the
 * row's height rather than fitting inside the 44pt floor: 56 + the row's own
 * 7pt padding makes a 70pt row, which is the media-row height Strong and Hevy
 * both land on. Rows without art are unaffected and stay at 44.
 */
const ART_SIZE = 56;

/**
 * kit's `lrow()`. No fill and no border — 44pt tall so the touch target is real,
 * and whatever wraps it (a RowPlate) carries the containment.
 */
export function ListRow({
  title,
  lead,
  art,
  quiet = false,
  meta,
  valueLabel,
  value,
  valueDim = false,
  right,
  grip = false,
  readOnly = false,
  chevron = !readOnly,
  dim = false,
}: Props) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 7,
          minHeight: readOnly ? size.readRow : size.hit,
        },
        dim && { opacity: 0.55 },
      ]}
    >
      {art != null ? (
        <Image
          source={art}
          style={{ width: ART_SIZE, height: ART_SIZE }}
          contentFit="contain"
          tintColor={color.mid}
          // The art is one drawing per row in a list of hundreds; caching the
          // decode is what keeps a fling from re-decoding every frame.
          cachePolicy="memory-disk"
          transition={0}
        />
      ) : null}
      {grip ? <Grip /> : null}
      {lead ? (
        <Text style={[text.meta, { width: LEAD_WIDTH, color: color.dim }]}>{lead}</Text>
      ) : null}

      <View style={{ gap: 3, flexShrink: 1 }}>
        <Text style={quiet ? text.rowName : text.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {meta ? <Text style={text.meta}>{meta}</Text> : null}
      </View>

      <View style={{ flex: 1 }} />

      {right ?? <RowValue label={valueLabel} value={value} dim={valueDim} />}
      {chevron ? <Chevron /> : null}
    </View>
  );
}

function RowValue({ label, value, dim }: { label?: string; value?: string; dim: boolean }) {
  if (!label && !value) return null;
  if (label && !value) return <Text style={[text.label, { marginRight: VALUE_GAP }]}>{label}</Text>;

  return (
    <View style={{ alignItems: 'flex-end', gap: 3, marginRight: VALUE_GAP }}>
      {label ? <Text style={text.label}>{label}</Text> : null}
      <Text style={[text.numSm, dim && { color: color.dim }]}>{value}</Text>
    </View>
  );
}
