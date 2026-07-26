import { Accordion, Text } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, userEvent } from 'storybook/test';

const meta = {
  title: 'Components/Interaction/Accordion',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => (
    <Accordion.Root type="single" collapsible defaultValue="item-1">
      <Accordion.Item value="item-1">
        <Accordion.Header>
          <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>
          <Text>Yes. It adheres to the WAI-ARIA design pattern.</Text>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Header>
          <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content>
          <Text>Yes — height animation with reduced-motion support.</Text>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  ),
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(/WAI-ARIA design pattern/),
    ).toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Is it animated?' }),
    );
    await expect(
      canvas.getByText(/height animation/),
    ).toBeInTheDocument();
  },
};
