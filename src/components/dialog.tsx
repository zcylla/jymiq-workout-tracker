import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { chromeShadow, color, containment, motion, radius, size, space, text, wash } from '@/theme';

/**
 * The app's own confirm, replacing `Alert.alert`.
 *
 * A native dialog is the one surface in the app drawn by someone else: Material
 * type, Material spacing, a blue that is not in the palette, and — on the three
 * destructive flows — no way to make "Discard" look different from "Keep going".
 * §0 says the accent must not appear twice at size and that a lapse and a rest
 * day must not look alike; a platform dialog cannot honour either.
 *
 * It is built out of the vocabulary that already exists rather than a new one:
 * the sheet's scrim, a grouped plate, the row-plate idiom for anything you
 * touch (Lab 42), and the text ramp. Nothing here is a new decision except the
 * one §0 has no word for — which action is destructive — and that is carried by
 * `live`, the palette's red.
 */

export type DialogTone = 'default' | 'primary' | 'destructive' | 'cancel';

export interface DialogAction {
  label: string;
  tone?: DialogTone;
  onPress?: () => void;
}

export interface DialogRequest {
  title: string;
  message?: string;
  /** Omitted gives a single "OK" — a notice rather than a question. */
  actions?: DialogAction[];
}

type Show = (request: DialogRequest) => void;

const DialogContext = createContext<Show | null>(null);

/**
 * Imperative on purpose. Every one of these fires from an event handler, and a
 * declarative `<Dialog open={…}>` would put a piece of transient state in every
 * screen that asks a question — sixteen call sites, sixteen `useState`s.
 */
export function useDialog(): Show {
  const show = useContext(DialogContext);
  if (!show) throw new Error('useDialog must be used inside <DialogProvider>');
  return show;
}

const ACTION_COLOR: Record<DialogTone, string> = {
  default: color.hi,
  primary: color.accent,
  destructive: color.live,
  cancel: color.lo,
};

const OK: DialogAction[] = [{ label: 'OK', tone: 'primary' }];

export function DialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<DialogRequest | null>(null);
  const show = useCallback<Show>((next) => setRequest(next), []);
  const value = useMemo(() => show, [show]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {request ? <DialogView request={request} onClose={() => setRequest(null)} /> : null}
    </DialogContext.Provider>
  );
}

function DialogView({ request, onClose }: { request: DialogRequest; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const actions = request.actions?.length ? request.actions : OK;

  const cancel = actions.find((a) => a.tone === 'cancel');
  const dismiss = useCallback(() => {
    onClose();
    cancel?.onPress?.();
  }, [cancel, onClose]);

  /**
   * A real `Modal`, not an absolutely-positioned overlay, and only because of
   * the back button. Android routes back to the focused modal through
   * `onRequestClose`, which is deterministic — a `BackHandler` subscription is
   * not. The live screen's own handler has no dependency array, so it
   * re-subscribes on every render and became the most recent listener the
   * moment a dialog opened: back then dismissed the dialog *and* fell through,
   * which on the finish flow opened the discard confirm behind it.
   */
  return (
    <Modal
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="none"
      visible
      // Back with no way out but a decision must not be a way out.
      onRequestClose={cancel ? dismiss : () => undefined}
    >
      <Animated.View
        entering={FadeIn.duration(motion.fast)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Pressable
          // A dialog with no way out but a decision should not have one added by
          // the scrim; one that offers Cancel already has that answer.
          onPress={cancel ? dismiss : undefined}
          accessibilityRole={cancel ? 'button' : 'none'}
          accessibilityLabel={cancel ? cancel.label : undefined}
          style={{ flex: 1, backgroundColor: wash.scrim }}
        />
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: space.pad }}>
        <Animated.View
          entering={FadeInDown.duration(motion.base).withInitialValues({
            transform: [{ translateY: 12 }],
          })}
          style={[
            containment.groupedPlate,
            {
              // A dialog is chrome, and §0 gives chrome the heavier drop shadow
              // that does the separating blur does on iOS. On a near-black
              // ground the scrim alone barely dims anything, so the shadow is
              // what actually lifts this off the screen behind it.
              boxShadow: chromeShadow,
              padding: 18,
              gap: space.within,
              maxWidth: Math.min(width - space.pad * 2, 340),
              alignSelf: 'center',
              width: '100%',
            },
          ]}
        >
          <Text style={text.rowTitle}>{request.title}</Text>
          {request.message ? <Text style={text.body}>{request.message}</Text> : null}

          {/* Stacked and full-width rather than a row of text buttons: every
              touchable in this app is a 44pt plate, and a stack reads the same
              with two actions as with three. */}
          <View style={{ gap: space.row, paddingTop: 4 }}>
            {actions.map((action) => (
              <Pressable
                key={action.label}
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  action.onPress?.();
                }}
                style={{
                  minHeight: size.hit,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.row,
                  borderCurve: 'continuous',
                  backgroundColor: wash.field,
                }}
              >
                <Text style={[text.rowName, { color: ACTION_COLOR[action.tone ?? 'default'] }]}>
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
