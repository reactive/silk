/** Whether two lists hold the same items in the same order (`Object.is`, so NaN matches NaN). */
export function sameItems<T>(a: readonly T[], b: readonly T[]): boolean {
  'worklet';
  return a.length === b.length && a.every((item, at) => Object.is(item, b[at]));
}
