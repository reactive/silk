import { useContext } from 'react';
import { unstable_TextAncestorContext } from 'react-native';

/**
 * Whether it renders inside a line of text: under a `Text`, with no `View`
 * between (a View resets it). Native only; the web's twin is
 * `inText.dom.ts`, chosen by the package's `#in-text` import.
 */
export function useInText(): boolean {
  return useContext(unstable_TextAncestorContext);
}
