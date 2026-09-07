import { Pressable, Text, TextInput, View } from 'react-native';

import { color, radius, size, text, wash } from '@/theme';

import { Icon } from './icon';

/**
 * kit's search bar. A ground rather than a plate — it is a place to type, not a
 * thing to press, so it carries no lit edge.
 *
 * With `onPress` and no `onChangeText` it is a button that opens search
 * elsewhere; with `onChangeText` it types in place.
 */
export function SearchField({
  placeholder,
  value,
  onChangeText,
  onPress,
}: {
  placeholder: string;
  value?: string;
  onChangeText?: (next: string) => void;
  onPress?: () => void;
}) {
  const frame = {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    minHeight: size.hit,
    borderRadius: radius.plate,
    borderCurve: 'continuous' as const,
    backgroundColor: wash.field,
  };

  if (onChangeText) {
    return (
      <View style={frame}>
        <Icon name="search" size={18} tone={color.dim} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={color.dim}
          returnKeyType="search"
          autoCorrect={false}
          style={[text.rowName, { flex: 1, padding: 0 }]}
        />
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={frame}>
      <Icon name="search" size={18} tone={color.dim} />
      <Text style={[text.rowName, { color: color.dim }]}>{placeholder}</Text>
    </Pressable>
  );
}
