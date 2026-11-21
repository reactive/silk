import type { Ref } from 'react';

/** Hands `node` to a caller's `ref`, a function or an object, alongside a component's own. */
export function assignRef<T>(ref: Ref<T> | undefined, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}
