import { moved } from './reorder.ts';
import type { SetKind } from './volume.ts';

export type TypedSet = { id: string; kind: SetKind };

export const SET_TYPE_LABELS: Record<SetKind, string> = {
  warmup: 'Warmup',
  working: 'Working',
  drop: 'Drop',
  failure: 'Failure',
};

export const isWorkingSet = (set: Pick<TypedSet, 'kind'>): boolean =>
  set.kind === 'working' || set.kind === 'failure';

// A parent and its contiguous drops are persisted as one ordered sequence.
export function dropParent<T extends TypedSet>(sets: readonly T[], id: string): T | null {
  let parent: T | null = null;
  for (const set of sets) {
    if (set.id === id) return set.kind === 'drop' ? parent : null;
    if (isWorkingSet(set)) parent = set;
    else if (set.kind !== 'drop') parent = null;
  }
  return null;
}

function groupEnd(sets: readonly TypedSet[], index: number): number {
  let end = index + 1;
  if (isWorkingSet(sets[index])) {
    while (sets[end]?.kind === 'drop') end++;
  }
  return end;
}

export function setTypeLabel(sets: readonly TypedSet[], id: string): string {
  const set = sets.find((s) => s.id === id);
  if (!set) return '';
  const parent = dropParent(sets, id);
  return parent
    ? `Drop · set ${sets.findIndex((s) => s.id === parent.id) + 1}`
    : SET_TYPE_LABELS[set.kind];
}

export function setTypeOrdinal(sets: readonly TypedSet[], id: string): number {
  const at = sets.findIndex((s) => s.id === id);
  if (at < 0) return 1;
  const current = sets[at];
  return sets
    .slice(0, at + 1)
    .filter((s) => (isWorkingSet(current) ? isWorkingSet(s) : s.kind === current.kind)).length;
}

export function insertTypedSet<T extends TypedSet>(
  sets: readonly T[],
  set: T,
  parentId?: string,
): T[] {
  const next = [...sets];
  let at = sets.length;
  if (set.kind === 'warmup') {
    at = sets.findIndex((s) => s.kind !== 'warmup');
    if (at < 0) at = sets.length;
  } else if (set.kind === 'drop') {
    const parent = sets.findIndex((s) => s.id === parentId);
    if (parent < 0 || !isWorkingSet(sets[parent])) {
      throw new Error('Choose a working set for this drop.');
    }
    at = groupEnd(sets, parent);
  }
  next.splice(at, 0, set);
  return next;
}

export function changeSetKind<T extends TypedSet>(
  sets: readonly T[],
  id: string,
  kind: SetKind,
  parentId?: string,
): T[] {
  const at = sets.findIndex((s) => s.id === id);
  if (at < 0) throw new Error('This set no longer exists.');
  const set = sets[at];
  if (
    isWorkingSet(set) &&
    kind !== 'working' &&
    kind !== 'failure' &&
    groupEnd(sets, at) > at + 1
  ) {
    throw new Error('This working set has linked drops. Change or remove its drops first.');
  }
  if (kind === set.kind && (kind !== 'drop' || dropParent(sets, id)?.id === parentId)) {
    return [...sets];
  }
  const changed = { ...set, kind };
  const rest = sets.filter((s) => s.id !== id);
  if (kind === 'drop' || kind === 'warmup') return insertTypedSet(rest, changed, parentId);
  const parent = dropParent(sets, id);
  const insertAt = parent
    ? groupEnd(
        rest,
        rest.findIndex((s) => s.id === parent.id),
      )
    : at;
  rest.splice(insertAt, 0, changed);
  return rest;
}

export function removalSetIds(sets: readonly TypedSet[], id: string): string[] {
  const at = sets.findIndex((s) => s.id === id);
  return at < 0 ? [] : sets.slice(at, groupEnd(sets, at)).map((s) => s.id);
}

export function moveSetGroup<T extends TypedSet>(
  sets: readonly T[],
  from: number,
  to: number,
): T[] {
  if (!sets[from] || !sets[to] || from === to) return [...sets];
  const parent = dropParent(sets, sets[from].id);
  if (sets[from].kind === 'drop') {
    return parent && dropParent(sets, sets[to].id)?.id === parent.id
      ? moved(sets, from, to)
      : [...sets];
  }
  const end = groupEnd(sets, from);
  if (to >= from && to < end) return [...sets];
  const targetParent = dropParent(sets, sets[to].id);
  const target = targetParent ? sets.findIndex((s) => s.id === targetParent.id) : to;
  const block = sets.slice(from, end);
  const rest = sets.filter((s) => !block.some((b) => b.id === s.id));
  const targetIndex = rest.findIndex((s) => s.id === sets[target].id);
  rest.splice(to > from ? groupEnd(rest, targetIndex) : targetIndex, 0, ...block);
  return rest;
}

export function validateSetOrder(sets: readonly TypedSet[], orderedIds: readonly string[]): void {
  if (
    orderedIds.length !== sets.length ||
    new Set(orderedIds).size !== sets.length ||
    orderedIds.some((id) => !sets.some((s) => s.id === id))
  ) {
    throw new Error('Reorder all sets of one exercise together.');
  }
  const reordered = orderedIds.map((id) => sets.find((s) => s.id === id)!);
  for (const set of sets) {
    if (set.kind === 'drop' && dropParent(sets, set.id)?.id !== dropParent(reordered, set.id)?.id) {
      throw new Error('Move a working set together with its linked drops.');
    }
  }
}

export function continuesDropGroup(
  sets: readonly TypedSet[],
  fromId: string,
  nextId: string | null,
): boolean {
  if (nextId == null) return false;
  const nextParent = dropParent(sets, nextId);
  if (!nextParent) return false;
  const parent = dropParent(sets, fromId);
  return (
    (nextParent.id === fromId || nextParent.id === parent?.id) &&
    sets.findIndex((s) => s.id === nextId) > sets.findIndex((s) => s.id === fromId)
  );
}
