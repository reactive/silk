import {
  containerBreakpointNames,
  containerBreakpoints,
  type ContainerBreakpoint,
} from './containerBreakpoints';

/**
 * `@container` rule text for Inline. Interpolate **last** in Inline's Linaria
 * `css` block so these declarations win over equal-specificity
 * `flex-direction` / `align-items` variant rules by source order (not by a
 * separate Linaria class, which races registration order).
 *
 * Below the breakpoint the row becomes a column and stretches. `justify`
 * still maps to `justify-content`, so it flips visual axis at the breakpoint
 * — collapsing does not neutralize that.
 */
export const collapseBelowRulesInline: string = containerBreakpointNames
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
