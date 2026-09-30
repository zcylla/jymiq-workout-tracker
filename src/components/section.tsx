import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { hairline, space, text } from '@/theme';

import { Plate } from './plate';

type Props = {
  /** The mono label on the canvas, outside the plate. Omit for an unlabelled block. */
  label?: string;
  /** An action at the right end of the label line. */
  right?: ReactNode;
  /** Sits left of the label — an ExerciseStill, usually. */
  lead?: ReactNode;
  /** First section on the screen: it sits under the header, not 46pt below it. */
  first?: boolean;
  /**
   * False puts the content straight on the canvas. Use it for anything that
   * already carries its own structure — row plates, a rail, a chart, a table.
   * Plating those is containment twice.
   */
  plated?: boolean;
  tone?: 'raised' | 'panel' | 'glass';
  pad?: number;
  /** The hairline running from the label to the right edge. */
  rule?: boolean;
  children: ReactNode;
};

/**
 * kit's `psec()`, settled at Lab 40's M4: label outside the plate with a
 * hairline running to the right edge, content on a lit plate.
 *
 * The 46pt top padding is the spacing law — between-section space is at least
 * 3x within-section space, and it is the whole structure of every screen.
 */
export function Section({
  label,
  right,
  lead,
  first = false,
  plated = true,
  tone,
  pad,
  rule = true,
  children,
}: Props) {
  return (
    <View style={{ paddingTop: first ? 8 : space.between, gap: space.within }}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 2 }}>
          {lead ? <View style={{ marginRight: space.within }}>{lead}</View> : null}
          <Text style={text.label}>{label}</Text>
          {rule ? (
            <View
              style={{
                flex: 1,
                height: 1,
                marginLeft: space.within,
                backgroundColor: hairline.ruled,
              }}
            />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {right}
        </View>
      ) : null}
      {plated ? (
        <Plate tone={tone} pad={pad}>
          {children}
        </Plate>
      ) : (
        children
      )}
    </View>
  );
}
