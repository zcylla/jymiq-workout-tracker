import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { color, size, space, text } from '@/theme';

import { Sheet } from './sheet';

type Props = {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  note: string | null;
  /** Called on every edit, so closing by any route — scrim, drag, back — has nothing left to save. */
  onChange: (note: string) => void;
};

/** The current lift's note: one multiline field, written as you type. */
export function NoteSheet({ open, onClose, exerciseName, note, onChange }: Props) {
  const [draft, setDraft] = useState(note ?? '');
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(note ?? '');
  }

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: space.within }}>
        <Text style={text.label} numberOfLines={1}>
          NOTE · {exerciseName.toUpperCase()}
        </Text>
        <TextInput
          value={draft}
          onChangeText={(next) => {
            setDraft(next);
            onChange(next);
          }}
          placeholder="Seat height, grip, how it felt"
          placeholderTextColor={color.dim}
          multiline
          autoFocus
          textAlignVertical="top"
          style={[text.field, { minHeight: size.hit * 2, padding: 0 }]}
        />
      </View>
    </Sheet>
  );
}
