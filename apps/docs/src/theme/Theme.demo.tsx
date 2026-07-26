import { Button, Inline, Text } from '@reactive/silk';
import type { JSX } from 'react';
import { SurfacePanel } from '../surfacePanel';
import { emberLight } from './tenants';

/** Warm tenant — same ember light theme as TenantGallery. */
export const tenantTheme = emberLight;

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
