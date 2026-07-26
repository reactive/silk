import { styled } from '@linaria/react';
import { Stack } from '@reactive/silk';

/** Neutral raised panel chrome for docs stories. */
export const SurfacePanel = styled(Stack)`
  padding: var(--silk-space-4);
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface);
  color: var(--silk-color-text-primary);
`;
