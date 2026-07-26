import {
  Box,
  Button,
  Container,
  Grid,
  Inline,
  Separator,
  Stack,
  Text,
  ThemeProvider,
  type DensityName,
} from '@reactive/silk';
import type { CSSProperties, JSX } from 'react';

export type AppSkeletonState =
  | 'normal'
  | 'sidebarCollapse'
  | 'overflow'
  | 'longContent'
  | 'compactDensity';

export interface AppSkeletonProps {
  readonly state?: AppSkeletonState;
}

const shellStyle: CSSProperties = {
  minHeight: '28rem',
  border: '1px solid var(--silk-color-border-subtle)',
  borderRadius: 'var(--silk-radius-lg)',
  backgroundColor: 'var(--silk-color-surface)',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  backgroundColor: 'var(--silk-color-surface-raised)',
  borderBottom: '1px solid var(--silk-color-border-subtle)',
};

const sidebarStyle: CSSProperties = {
  backgroundColor: 'var(--silk-color-surface-raised)',
  borderInlineEnd: '1px solid var(--silk-color-border-subtle)',
  minWidth: 0,
};

const footerStyle: CSSProperties = {
  backgroundColor: 'var(--silk-color-surface-raised)',
  borderTop: '1px solid var(--silk-color-border-subtle)',
};

const navItemStyle: CSSProperties = {
  padding: 'var(--silk-space-2) var(--silk-space-3)',
  borderRadius: 'var(--silk-radius-sm)',
  backgroundColor: 'var(--silk-color-tone-neutral-subtle)',
};

/**
 * Committed Stage 1 exit fixture — app chrome built from layout primitives only.
 */
export function AppSkeleton({
  state = 'normal',
}: AppSkeletonProps): JSX.Element {
  const density: DensityName | undefined =
    state === 'compactDensity' ? 'compact' : undefined;
  const narrow = state === 'sidebarCollapse';
  const overflow = state === 'overflow';
  const longContent = state === 'longContent';

  const body = (
    <Box
      data-fixture="app-skeleton"
      data-fixture-state={state}
      style={{
        ...shellStyle,
        ...(narrow ? { maxWidth: '22rem' } : {}),
        ...(overflow ? { maxHeight: '22rem', overflow: 'auto' } : {}),
      }}
      contain
    >
      <Stack gap="0" style={{ minHeight: '28rem' }}>
        <Box padding="3" style={headerStyle} data-region="header">
          <Inline justify="between" align="center" wrap="nowrap">
            <Text role="heading">Silk App</Text>
            <Inline gap="2" wrap="nowrap">
              <Button size="sm" variant="ghost" tone="neutral">
                Docs
              </Button>
              <Button size="sm">Sign in</Button>
            </Inline>
          </Inline>
        </Box>

        <Stack
          direction="row"
          gap="0"
          collapseBelow="md"
          style={{ flex: 1, minHeight: 0 }}
          data-region="body"
        >
          <Box
            padding="3"
            style={{
              ...sidebarStyle,
              ...(narrow ? { flex: '1 1 auto' } : { flex: '0 0 12rem' }),
            }}
            data-region="sidebar"
          >
            <Stack gap="2">
              <Text role="label">Navigation</Text>
              <Separator />
              {['Overview', 'Projects', 'Settings'].map((item) => (
                <Box key={item} style={navItemStyle}>
                  <Text role="caption">{item}</Text>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box
            padding="4"
            style={{
              flex: 1,
              minWidth: 0,
              ...(overflow ? { overflow: 'auto', maxHeight: '100%' } : {}),
            }}
            data-region="content"
          >
            <Container size="md" padding="0">
              <Stack gap="4">
                <Stack gap="2">
                  <Text role="headingLg">Workspace</Text>
                  <Text tone="secondary">
                    Header, sidebar, content, and footer composed from Box,
                    Stack, Inline, Grid, Container, and Separator.
                  </Text>
                </Stack>
                <Separator />
                <Grid
                  columns={narrow ? '1' : 'auto'}
                  gap="3"
                  minColumnWidth="9rem"
                >
                  {['Alpha', 'Beta', 'Gamma', 'Delta'].map((name) => (
                    <Box
                      key={name}
                      padding="3"
                      style={{
                        borderRadius: 'var(--silk-radius-md)',
                        border: '1px solid var(--silk-color-border-subtle)',
                        backgroundColor: 'var(--silk-color-surface-raised)',
                      }}
                    >
                      <Text role="label">{name}</Text>
                      <Text tone="secondary" role="caption">
                        Card body
                      </Text>
                    </Box>
                  ))}
                </Grid>
                {longContent ? (
                  <Box
                    padding="3"
                    style={{
                      overflow: 'auto',
                      borderRadius: 'var(--silk-radius-md)',
                      border: '1px solid var(--silk-color-border-subtle)',
                    }}
                    data-region="long-content"
                  >
                    <Text role="caption">
                      {`${'supercalifragilisticexpialidocious_'.repeat(8)}end`}
                    </Text>
                  </Box>
                ) : null}
                {overflow
                  ? Array.from({ length: 12 }, (_, i) => (
                      <Text key={i} tone="secondary">
                        Overflow row {i + 1}: additional content to force scroll
                        within the fixture shell.
                      </Text>
                    ))
                  : null}
              </Stack>
            </Container>
          </Box>
        </Stack>

        <Box padding="3" style={footerStyle} data-region="footer">
          <Inline justify="between" align="center">
            <Text tone="secondary" role="caption">
              Built with Silk layout primitives
            </Text>
            <Text tone="secondary" role="caption">
              state: {state}
            </Text>
          </Inline>
        </Box>
      </Stack>
    </Box>
  );

  return density !== undefined ? (
    <ThemeProvider density={density}>{body}</ThemeProvider>
  ) : (
    body
  );
}
