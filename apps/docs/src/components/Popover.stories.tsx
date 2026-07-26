import { Button, Popover, Stack, Text, popoverRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/Popover',
  component: Popover.Content,
  argTypes: {
    size: {
      control: 'select',
      options: [...popoverRecipe.variants.size],
    },
  },
} satisfies Meta<typeof Popover.Content>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { size: popoverRecipe.defaults.size },
  render: ({ size = popoverRecipe.defaults.size }): JSX.Element => (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button>Open popover</Button>
      </Popover.Trigger>
      <Popover.Content size={size} aria-labelledby="popover-details-title">
        <Stack gap="2">
          <Text role="heading" id="popover-details-title">
            Details
          </Text>
          <Text tone="secondary">Floating surface with size axis.</Text>
          <Popover.Close asChild>
            <Button size="sm" variant="outline">
              Close
            </Button>
          </Popover.Close>
        </Stack>
      </Popover.Content>
    </Popover.Root>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open popover' }));
    await expect(await screen.findByText('Details')).toBeInTheDocument();
  },
};
