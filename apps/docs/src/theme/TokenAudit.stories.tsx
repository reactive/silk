import { css } from '@linaria/core';
import {
  Badge,
  Button,
  Inline,
  Surface,
  Text,
  badgeRecipe,
  buttonRecipe,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { VariantMatrix } from '../VariantMatrix';

const auditSurfaceClass: string = css`
  padding: var(--silk-space-4);
  min-width: 7rem;
`;

const meta = {
  title: 'Theme/TokenAudit',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonToneMatrix: Story = {
  tags: ['!test'],
  render: (): JSX.Element => (
    <VariantMatrix
      rows={buttonRecipe.variants.variant}
      columns={buttonRecipe.variants.tone}
    >
      {(variant, tone): JSX.Element => (
        <Button variant={variant} tone={tone}>
          {tone}
        </Button>
      )}
    </VariantMatrix>
  ),
};

export const BadgeToneMatrix: Story = {
  tags: ['!test'],
  render: (): JSX.Element => (
    <VariantMatrix
      rows={badgeRecipe.variants.variant}
      columns={badgeRecipe.variants.tone}
    >
      {(variant, tone): JSX.Element => (
        <Badge variant={variant} tone={tone}>
          {tone}
        </Badge>
      )}
    </VariantMatrix>
  ),
};

export const ElevationSurfaces: Story = {
  tags: ['!test'],
  render: (): JSX.Element => (
    <Inline gap="3" align="stretch" wrap="nowrap">
      {(['sunken', 'flat', 'raised', 'overlay'] as const).map((elevation) => (
        <Surface
          key={elevation}
          elevation={elevation}
          border="subtle"
          className={auditSurfaceClass}
        >
          <Text>{elevation}</Text>
        </Surface>
      ))}
    </Inline>
  ),
};
