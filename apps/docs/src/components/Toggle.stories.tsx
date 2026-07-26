import { Toggle, ToggleGroup, toggleRecipe } from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';

const meta = {
  title: 'Components/Interaction/Toggle',
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => (
    <Toggle aria-label="Italic" size={toggleRecipe.defaults.size}>
      I
    </Toggle>
  ),
};

export const Group: Story = {
  render: (): JSX.Element => (
    <ToggleGroup.Root type="single" defaultValue="center" aria-label="Text align">
      <ToggleGroup.Item value="left" aria-label="Left">
        Left
      </ToggleGroup.Item>
      <ToggleGroup.Item value="center" aria-label="Center">
        Center
      </ToggleGroup.Item>
      <ToggleGroup.Item value="right" aria-label="Right">
        Right
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  ),
};
