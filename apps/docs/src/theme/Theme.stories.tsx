import {
  Button,
  SilkProvider,
  Stack,
  Text,
  createTheme,
} from '@reactive/silk';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import type { JSX } from 'react';
import { SurfacePanel } from '../surfacePanel';

const meta = {
  title: 'Theme/ThemeProvider',
  parameters: {
    docs: {
      description: {
        component:
          'Named schemes flip `data-theme` against static CSS. Custom themes set CSS variables on the provider style attribute. Prefer one of `theme` or `colorScheme`.',
      },
    },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const tenantTheme = createTheme({
  colorScheme: 'light',
  semantic: {
    color: {
      surface: '#fff7ed',
      surfaceRaised: '#ffedd5',
      textPrimary: '#7c2d12',
      textSecondary: '#9a3412',
      borderSubtle: '#fdba74',
    },
  },
});

const providerDefaults = {
  Button: { variant: 'soft', tone: 'neutral' },
  Text: { tone: 'secondary' },
} as const;

function ThemeDemo({ label }: { readonly label: string }): JSX.Element {
  return (
    <SurfacePanel gap="3">
      <Text role="heading">{label}</Text>
      <Text tone="secondary">
        Surface, text, and accent tokens resolve from the active theme scope.
      </Text>
      <Stack direction="row" gap="2">
        <Button>Accent</Button>
        <Button tone="neutral" variant="outline">
          Neutral
        </Button>
        <Button tone="danger" variant="soft">
          Danger
        </Button>
      </Stack>
    </SurfacePanel>
  );
}

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
        <Stack direction="row" gap="2">
          <Button>Default soft/neutral</Button>
          <Button tone="accent" variant="solid">
            Explicit accent solid
          </Button>
        </Stack>
      </SurfacePanel>
    </SilkProvider>
  ),
};
