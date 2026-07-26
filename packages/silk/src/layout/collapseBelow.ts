import {
  containerBreakpointNames,
  containerBreakpoints,
  type ContainerBreakpoint,
} from './containerBreakpoints';

/**
 * Shared `@container` rule text for Stack/Inline. Interpolate **last** in each
 * component's Linaria `css` block so these declarations win over equal-
 * specificity `flex-direction` / `align-items` variant rules by source order
 * (not by a separate Linaria class, which races registration order).
 */
export const collapseBelowRules: string = containerBreakpointNames
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

export type CollapseBelowProp = ContainerBreakpoint | false | undefined;

export function collapseBelowDomProps(
  collapseBelow: CollapseBelowProp,
): { readonly 'data-collapse-below': ContainerBreakpoint } | undefined {
  if (collapseBelow === undefined || collapseBelow === false) {
    return undefined;
  }
  return { 'data-collapse-below': collapseBelow };
}
