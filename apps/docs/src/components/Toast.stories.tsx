import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { expect, screen, userEvent } from 'storybook/test';
import { withSource } from '../docsSource';
import { ToastStory } from './Toast.demo';
import toastDemoSource from './Toast.demo.tsx?raw';

const meta = {
  title: 'Components/Interaction/Toast',
  parameters: withSource(toastDemoSource),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (): JSX.Element => <ToastStory />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Show toast' }));
    await expect(await screen.findByText('Scheduled')).toBeInTheDocument();
  },
};
