import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { withSource } from '../docsSource';
import { TenantGallery } from './TenantGallery';
import tenantGallerySource from './TenantGallery.tsx?raw';
import tenantsSource from './tenants.ts?raw';

const meta = {
  title: 'Theme/TenantGallery',
  parameters: {
    docs: {
      description: {
        component:
          'Stage 5 exit: two visually distinct tenant themes (Ocean, Ember), each with paired light/dark from `generatePairedPalette`, rendered side by side with inline CSS variables only.',
      },
      ...withSource(tenantGallerySource, tenantsSource).docs,
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SideBySide: Story = {
  tags: ['test'],
  render: (): JSX.Element => <TenantGallery />,
};
