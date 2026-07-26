import { css } from '@linaria/core';
import {
  containerBreakpointNames,
  containerBreakpoints,
  type ContainerBreakpoint,
} from './containerBreakpoints';

const collapseBelowCss: string = containerBreakpointNames
  .map((name) => {
    const px = containerBreakpoints[name];
    return `
    @container (width < ${px}px) {
      &:where([data-collapse-below='${name}']) {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;
  })
  .join('\n');

/**
 * Shared Linaria class for Stack/Inline — one `@container` rule set in the
 * CSS bundle instead of duplicating per component.
 */
export const collapseBelowClass: string = css`
  ${collapseBelowCss}
`;

export type CollapseBelowProp = ContainerBreakpoint | false | undefined;

export function collapseBelowDomProps(
  collapseBelow: CollapseBelowProp,
): { readonly 'data-collapse-below': ContainerBreakpoint } | undefined {
  if (collapseBelow === undefined || collapseBelow === false) {
    return undefined;
  }
  return { 'data-collapse-below': collapseBelow };
}
