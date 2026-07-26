import {
  Badge,
  Button,
  Inline,
  Input,
  SilkProvider,
  Stack,
  Text,
  checkThemeContrast,
  createTheme,
  generatePairedPalette,
  type Theme,
} from '@reactive/silk';
import { parseCanonicalHex } from '@reactive/silk-core';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type JSX,
} from 'react';
import { SurfacePanel } from '../surfacePanel';

export interface ThemePlaygroundControls {
  readonly brandSeed?: string;
  readonly colorScheme?: 'light' | 'dark';
  readonly surface?: string;
  readonly radiusMd?: number;
}

const DEFAULT_BRAND = '#0ea5e9';
const DEFAULT_SCHEME = 'light' as const;

function buildTheme(
  brandSeed: string,
  colorScheme: 'light' | 'dark',
  surface: string | undefined,
  radiusMd: number | undefined,
): Theme | null {
  const seed = parseCanonicalHex(brandSeed);
  if (!seed) {
    return null;
  }
  const paired = generatePairedPalette(seed);
  const surfaceHex =
    surface !== undefined ? parseCanonicalHex(surface) : undefined;
  return createTheme({
    colorScheme,
    palette: paired[colorScheme],
    semantic: {
      ...(surfaceHex ? { color: { surface: surfaceHex } } : {}),
      ...(radiusMd !== undefined ? { radius: { md: radiusMd } } : {}),
    },
  });
}

/**
 * Live theme playground — debounces control changes and holds the last valid
 * theme while the seed is mid-edit.
 */
export function ThemePlayground({
  brandSeed = DEFAULT_BRAND,
  colorScheme = DEFAULT_SCHEME,
  surface,
  radiusMd,
}: ThemePlaygroundControls): JSX.Element {
  const [theme, setTheme] = useState<Theme>(
    () =>
      buildTheme(brandSeed, colorScheme, surface, radiusMd) ??
      createTheme({ colorScheme }),
  );
  const lastValid = useRef(theme);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = buildTheme(brandSeed, colorScheme, surface, radiusMd);
      if (next) {
        lastValid.current = next;
        setTheme(next);
      } else {
        setTheme(lastValid.current);
      }
    }, 150);
    return () => window.clearTimeout(id);
  }, [brandSeed, colorScheme, surface, radiusMd]);

  const holding = parseCanonicalHex(brandSeed) === null;
  const contrast = useMemo(() => checkThemeContrast(theme), [theme]);

  return (
    <SilkProvider theme={theme}>
      <Stack
        gap="4"
        data-fixture="theme-playground"
        data-scheme={theme.colorScheme}
      >
        <SurfacePanel gap="3">
          <Text role="heading">Theme playground</Text>
          <Text tone="secondary">
            Brand seed {brandSeed} · {theme.colorScheme}
            {holding ? ' (holding last valid theme)' : ''}
          </Text>
          <Text
            data-contrast={contrast.ok ? 'ok' : 'fail'}
            tone={contrast.ok ? 'secondary' : 'danger'}
          >
            Contrast:{' '}
            {contrast.ok ? 'pass' : `${contrast.violations.length} issue(s)`}
          </Text>
          <Inline gap="2" wrap="wrap">
            <Button>Accent</Button>
            <Button tone="neutral" variant="outline">
              Neutral
            </Button>
            <Button tone="danger" variant="soft">
              Danger
            </Button>
            <Badge tone="success">Success</Badge>
          </Inline>
          <Input aria-label="Playground input" placeholder="Typed control" />
        </SurfacePanel>
      </Stack>
    </SilkProvider>
  );
}
