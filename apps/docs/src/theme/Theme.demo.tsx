import {
  Button,
  Inline,
  Text,
  createTheme,
} from '@reactive/silk';
import type { JSX } from 'react';
import { SurfacePanel } from '../surfacePanel';

export const tenantTheme = createTheme({
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

export const providerDefaults = {
  Button: { variant: 'soft', tone: 'neutral' },
  Text: { tone: 'secondary' },
} as const;

export function ThemeDemo({ label }: { readonly label: string }): JSX.Element {
  return (
    <SurfacePanel gap="3">
      <Text role="heading">{label}</Text>
      <Text tone="secondary">
        Surface, text, and accent tokens resolve from the active theme scope.
      </Text>
      <Inline gap="2">
        <Button>Accent</Button>
        <Button tone="neutral" variant="outline">
          Neutral
        </Button>
        <Button tone="danger" variant="soft">
          Danger
        </Button>
      </Inline>
    </SurfacePanel>
  );
}
