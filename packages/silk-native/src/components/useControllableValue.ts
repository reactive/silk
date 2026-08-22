import { useCallback, useState } from 'react';

/**
 * Keep controlled/uncontrolled storage semantics consistent without owning a
 * component's transition rules or callback timing.
 */
export function useControllableValue<T>(
  controlledValue: T | undefined,
  defaultValue: T,
): readonly [value: T, setUncontrolledValue: (next: T) => void] {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const setValue = useCallback(
    (next: T) => {
      if (controlledValue === undefined) {
        setUncontrolledValue(next);
      }
    },
    [controlledValue],
  );
  return [
    controlledValue === undefined ? uncontrolledValue : controlledValue,
    setValue,
  ];
}
