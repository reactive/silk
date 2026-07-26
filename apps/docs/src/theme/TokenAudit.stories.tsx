import { styled } from '@linaria/react';
import {
  Badge,
  Button,
  Heading,
  Inline,
  Stack,
  Surface,
  Text,
  badgeRecipe,
  buttonRecipe,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { matrixSource } from '../docsSource';
import { VariantMatrix } from '../VariantMatrix';

const AuditSurface = styled(Surface)`
  padding: var(--silk-space-4);
  min-width: 7rem;
`;

const MonoSample = styled.p`
  margin: 0;
  font-family: var(--silk-font-mono);
  font-size: var(--silk-typography-body-sm-size);
  line-height: var(--silk-typography-body-sm-line-height);
`;

const meta = {
  title: 'Theme/TokenAudit',
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const ButtonToneMatrix: Story = {
  tags: ['!test'],
  parameters: matrixSource,
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
  parameters: matrixSource,
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
        <AuditSurface key={elevation} elevation={elevation} border="subtle">
          <Text>{elevation}</Text>
        </AuditSurface>
      ))}
    </Inline>
  ),
};

export const FontFamilies: Story = {
  tags: ['!test'],
  render: (): JSX.Element => (
    <Stack gap="3">
      <Stack gap="1">
        <Text role="caption" tone="secondary">
          --silk-font-sans
        </Text>
        <Text>The quick brown fox jumps over the lazy dog.</Text>
      </Stack>
      <Stack gap="1">
        <Text role="caption" tone="secondary">
          --silk-font-serif
        </Text>
        <Heading level="1">The quick brown fox jumps over the lazy dog.</Heading>
      </Stack>
      <Stack gap="1">
        <Text role="caption" tone="secondary">
          --silk-font-mono
        </Text>
        <MonoSample>
          The quick brown fox jumps over the lazy dog.
        </MonoSample>
      </Stack>
    </Stack>
  ),
};
