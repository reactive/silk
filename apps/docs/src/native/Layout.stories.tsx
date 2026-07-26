import { Box, Inline, Stack, Text } from '@reactive/silk-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { withNativeSilk } from './withNativeSilk';

function LayoutDemo(): JSX.Element {
  return (
    <Box padding="4">
      <Stack gap="3">
        <Text role="heading">Native layout</Text>
        <Stack gap="2" rail="start">
          <Text>Stack with rail=start</Text>
          <Text tone="secondary">Nested line</Text>
        </Stack>
        <Inline gap="2" direction="row-reverse" align="baseline" wrap="wrap">
          <Text role="headingLg">Lg</Text>
          <Text role="caption">caption</Text>
          <Text>row-reverse</Text>
        </Inline>
      </Stack>
    </Box>
  );
}

const meta = {
  title: 'Native Components/Layout',
  component: LayoutDemo,
  decorators: [withNativeSilk],
} satisfies Meta<typeof LayoutDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Demo: Story = {};
