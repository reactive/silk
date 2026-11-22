/**
 * The web's `useInText`: always false, since a View inside a line of text
 * lays out in it there (react-native-web), so nothing needs to know.
 */
export function useInText(): boolean {
  return false;
}
