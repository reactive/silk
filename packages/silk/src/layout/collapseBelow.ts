import {
  containerBreakpointNames,
  containerBreakpoints,
  type ContainerBreakpoint,
} from './containerBreakpoints';

/**
 * `@container` rule text for Stack/Inline. Interpolate **last** in each
 * component's Linaria `css` block so these declarations win over equal-
 * specificity `flex-direction` / `align-items` variant rules by source order
 * (not by a separate Linaria class, which races registration order).
 *
 * Both always set `flex-direction: column` below the breakpoint. Inline also
 * stretches; Stack stretches only when not already `direction="column"` so
 * configured `align` is preserved.
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

export const collapseBelowRulesStack: string = containerBreakpointNames
  .map((name) => {
    const px = containerBreakpoints[name];
    return `
    @container (width < ${px}px) {
      &:where([data-collapse-below='${name}']) {
        flex-direction: column;
      }
      &:where(
        [data-collapse-below='${name}']:not([data-direction='column'])
      ) {
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
