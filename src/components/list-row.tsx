import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { color, size, text } from '@/theme';

import { Chevron, Grip } from './icon';

type Props = {
  title: string;
  /** kit's numbered gutter — the position column on a routine's lifts. */
  lead?: string;
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
 * kit's `lrow()`. No fill and no border — 44pt tall so the touch target is real,
 * and whatever wraps it (a RowPlate) carries the containment.
 */
export function ListRow({
  title,
  lead,
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
