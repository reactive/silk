import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import { Box } from '@reactive/silk';
import type { JSX } from 'react';

const DemoItem = styled(Box)`
  padding: var(--silk-space-2) var(--silk-space-3);
  border-radius: var(--silk-radius-sm);
  /* solid/on-solid — subtle+solid fails WCAG AA at 16px */
  background-color: var(--silk-color-tone-accent-solid);
  color: var(--silk-color-tone-accent-on-solid);
`;

/** Applied via Stack `className` args — stays a class string, not a component. */
export const tallFrameClass: string = css`
  height: 14rem;
  padding: var(--silk-space-3);
  border: 1px dashed var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);
`;

export function DemoItems(): JSX.Element {
  return (
    <>
      <DemoItem>One</DemoItem>
      <DemoItem>Two</DemoItem>
      <DemoItem>Three</DemoItem>
    </>
  );
}
