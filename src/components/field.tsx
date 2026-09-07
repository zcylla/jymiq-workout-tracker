import { Pressable, Text, TextInput, View } from 'react-native';

import { color, size, text } from '@/theme';

import { Chevron } from './icon';

/**
 * kit's `field()`: a mono label over a 17px value, 44pt tall, chevron if it
 * opens a picker. No box and no underline — §0 is explicit that a field is
 * type and space, not a control drawn around them.
 *
 * Given `onChangeText` the value becomes editable in place. The board draws
 * every field the same way, so the caret is the only thing that differs: a
 * borderless input on the row plate is the row plate doing its job.
 */
export function Field({
  label,
  value,
  placeholder = false,
  onPress,
  onChangeText,
  prompt,
  autoFocus,
  keyboard = 'text',
}: {
  label: string;
  value: string;
  /** The value is a prompt, not an answer yet. */
  placeholder?: boolean;
  onPress?: () => void;
  /** Given, the value is typed rather than picked. */
  onChangeText?: (next: string) => void;
  /** Placeholder text for the editable form. */
  prompt?: string;
  autoFocus?: boolean;
  /** An email must not be title-cased, and wants the keyboard with the @ on it. */
  keyboard?: 'text' | 'email';
}) {
  const body = (
    <View style={{ gap: 6, paddingVertical: 7 }}>
      <Text style={text.label}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: size.hit }}>
        {onChangeText ? (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={prompt}
            placeholderTextColor={color.dim}
            autoFocus={autoFocus}
            autoCapitalize={keyboard === 'email' ? 'none' : 'words'}
            autoCorrect={keyboard !== 'email'}
            keyboardType={keyboard === 'email' ? 'email-address' : 'default'}
            style={[text.field, { flex: 1, padding: 0 }]}
          />
        ) : (
          <>
            <Text style={[text.field, placeholder && { color: color.dim }]} numberOfLines={1}>
              {value}
            </Text>
            <View style={{ flex: 1 }} />
          </>
        )}
        {onPress ? <Chevron /> : null}
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.7 } : null)}>
      {body}
    </Pressable>
  );
}
