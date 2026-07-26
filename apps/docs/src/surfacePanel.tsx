import { styled } from '@linaria/react';
import { Stack } from '@reactive/silk';

/** Named `styled(Stack)` panel for theme/overlay demos — prefer `css` + `cx` for mixins (see Box → ClassComposition). */
export const SurfacePanel = styled(Stack)`
  padding: var(--silk-space-4);
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface);
  color: var(--silk-color-text-primary);
`;
