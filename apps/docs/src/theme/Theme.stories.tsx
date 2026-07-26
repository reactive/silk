import {
  Button,
  Inline,
  SilkProvider,
  Text,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { withSource } from '../docsSource';
import { SurfacePanel } from '../surfacePanel';
import surfacePanelSource from '../surfacePanel.tsx?raw';
import {
  ThemeDemo,
  providerDefaults,
  tenantTheme,
} from './Theme.demo';
import themeDemoSource from './Theme.demo.tsx?raw';

const meta = {
  title: 'Theme/ThemeProvider',
  parameters: {
    docs: {
      description: {
        component:
          'Named schemes flip `data-theme` against static CSS. Custom themes set CSS variables on the provider style attribute. Prefer one of `theme` or `colorScheme`.',
      },
      ...withSource(themeDemoSource, surfacePanelSource).docs,
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const NamedLight: Story = {
  render: (): JSX.Element => (
    <SilkProvider colorScheme="light">
      <ThemeDemo label="Named light" />
    </SilkProvider>
  ),
};

export const NamedDark: Story = {
  render: (): JSX.Element => (
    <SilkProvider colorScheme="dark">
      <ThemeDemo label="Named dark" />
    </SilkProvider>
  ),
};

export const System: Story = {
  render: (): JSX.Element => (
    <SilkProvider colorScheme="system">
      <ThemeDemo label="System (prefers-color-scheme)" />
    </SilkProvider>
  ),
};

export const CustomCreateTheme: Story = {
  render: (): JSX.Element => (
    <SilkProvider theme={tenantTheme}>
      <ThemeDemo label="Custom createTheme (tenant)" />
    </SilkProvider>
  ),
};

export const NestedProviders: Story = {
  render: (): JSX.Element => (
    <SilkProvider colorScheme="light">
      <SurfacePanel gap="4">
        <Text role="heading">Outer light</Text>
        <Button variant="soft">Outer action</Button>
        <SilkProvider colorScheme="dark">
          <ThemeDemo label="Inner dark (DOM inheritance)" />
        </SilkProvider>
      </SurfacePanel>
    </SilkProvider>
  ),
};

export const ProviderDefaults: Story = {
  render: (): JSX.Element => (
    <SilkProvider colorScheme="light" defaults={providerDefaults}>
      <SurfacePanel gap="3">
        <Text role="heading" tone="primary">
          Heading overrides default Text tone
        </Text>
        <Text>Body uses provider Text defaults (secondary).</Text>
        <Inline gap="2">
          <Button>Default soft/neutral</Button>
          <Button tone="accent" variant="solid">
            Explicit accent solid
          </Button>
        </Inline>
      </SurfacePanel>
    </SilkProvider>
  ),
};
