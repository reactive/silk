import { styled } from '@linaria/react';
import { Box, Text } from '@reactive/silk';
import type { JSX } from 'react';

const Cell = styled(Box)`
  padding: var(--silk-space-3);
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface-raised);
`;

export function Cells({ count }: { readonly count: number }): JSX.Element {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <Cell key={i}>
          <Text role="label">Cell {i + 1}</Text>
          <Text tone="secondary" role="caption">
            Grid track
          </Text>
        </Cell>
      ))}
    </>
  );
}
