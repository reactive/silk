/** Whether two lists hold the same items in the same order (`Object.is`, so NaN matches NaN). */
export const sameItems = <T>(a: readonly T[], b: readonly T[]): boolean =>
  a.length === b.length && a.every((item, at) => Object.is(item, b[at]));
