import {
  Badge,
  Button,
  Inline,
  Input,
  SilkProvider,
  Stack,
  Text,
  type Theme,
} from '@reactive/silk';
import type { JSX } from 'react';
import { SurfacePanel } from '../surfacePanel';
import {
  emberDark,
  emberLight,
  oceanDark,
  oceanLight,
} from './tenants';

function GalleryPanel({
  label,
  theme,
}: {
  readonly label: string;
  readonly theme: Theme;
}): JSX.Element {
  return (
    <SilkProvider theme={theme}>
      <SurfacePanel
        gap="3"
        data-tenant-panel={label}
        style={{ minWidth: 0 }}
      >
        <Text role="headingSm">{label}</Text>
        <Text tone="secondary">
          Surfaces, text, and tones resolve from the tenant theme scope.
        </Text>
        <Inline gap="2" wrap="wrap">
          <Button>Accent</Button>
          <Button tone="neutral" variant="outline">
            Neutral
          </Button>
          <Button tone="danger" variant="soft">
            Danger
          </Button>
          <Button tone="success" variant="soft">
            Success
          </Button>
        </Inline>
        <Inline gap="2" wrap="wrap">
          <Badge>Accent</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="success">Success</Badge>
        </Inline>
        <Input aria-label={`${label} input`} placeholder="Tenant input" />
      </SurfacePanel>
    </SilkProvider>
  );
}

/**
 * Four-panel Stage 5 exit fixture: two tenants × light/dark, side by side,
 * each under its own `SilkProvider theme=` (inline CSS variables only).
 */
export function TenantGallery(): JSX.Element {
  return (
    <Stack
      gap="4"
      data-fixture="tenant-gallery"
      data-fixture-state="side-by-side"
    >
      <Text role="heading">Tenant themes side by side</Text>
      <Inline gap="3" wrap="wrap" align="stretch">
        <GalleryPanel label="Ocean / light" theme={oceanLight} />
        <GalleryPanel label="Ocean / dark" theme={oceanDark} />
        <GalleryPanel label="Ember / light" theme={emberLight} />
        <GalleryPanel label="Ember / dark" theme={emberDark} />
      </Inline>
    </Stack>
  );
}
