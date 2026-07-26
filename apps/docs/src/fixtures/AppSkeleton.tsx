import { css } from '@linaria/core';
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
} from '@reactive/silk';
import type { JSX } from 'react';

export type AppSkeletonState =
  | 'normal'
  | 'sidebarCollapse'
  | 'overflow'
  | 'longContent'
  | 'compactDensity';

export interface AppSkeletonProps {
  readonly state?: AppSkeletonState;
}

const shellClass: string = css`
  min-height: 28rem;
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-lg);
  background-color: var(--silk-color-surface);
  overflow: hidden;

  &[data-narrow] {
    max-width: 22rem;
  }

  &[data-overflow] {
    max-height: 22rem;
    overflow: auto;
  }
`;

/** Fill the shell so the body's `flex: 1` has a definite height. */
const shellStackClass: string = css`
  min-height: 100%;
`;

const headerClass: string = css`
  background-color: var(--silk-color-surface-raised);
  border-bottom: 1px solid var(--silk-color-border-subtle);
`;

const bodyClass: string = css`
  flex: 1;
  min-height: 0;
`;

const sidebarClass: string = css`
  background-color: var(--silk-color-surface-raised);
  border-inline-end: 1px solid var(--silk-color-border-subtle);
  min-width: 0;
  flex: 0 0 12rem;

  &[data-narrow] {
    flex: 1 1 auto;
  }
`;

const contentClass: string = css`
  flex: 1;
  min-width: 0;

  &[data-overflow] {
    overflow: auto;
    max-height: 100%;
  }
`;

const navItemClass: string = css`
  padding: var(--silk-space-2) var(--silk-space-3);
  border-radius: var(--silk-radius-sm);
  background-color: var(--silk-color-tone-neutral-subtle);
`;

const cardTileClass: string = css`
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
  background-color: var(--silk-color-surface-raised);
`;

const longContentClass: string = css`
  overflow: auto;
  border-radius: var(--silk-radius-md);
  border: 1px solid var(--silk-color-border-subtle);
`;

const footerClass: string = css`
  background-color: var(--silk-color-surface-raised);
  border-top: 1px solid var(--silk-color-border-subtle);
`;

/**
 * Committed Stage 1 exit fixture — app chrome built from layout primitives only.
 */
export function AppSkeleton({
  state = 'normal',
}: AppSkeletonProps): JSX.Element {
  const narrow = state === 'sidebarCollapse';
  const overflow = state === 'overflow';
  const longContent = state === 'longContent';

  const body = (
    <Box
      data-fixture="app-skeleton"
      data-fixture-state={state}
      data-narrow={narrow || undefined}
      data-overflow={overflow || undefined}
      className={shellClass}
      contain
    >
      <Stack gap="0" className={shellStackClass}>
        <Box padding="3" className={headerClass} data-region="header">
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
          className={bodyClass}
          data-region="body"
        >
          <Box
            padding="3"
            className={sidebarClass}
            data-narrow={narrow || undefined}
            data-region="sidebar"
          >
            <Stack gap="2">
              <Text role="label">Navigation</Text>
              <Separator />
              {['Overview', 'Projects', 'Settings'].map((item) => (
                <Box key={item} className={navItemClass}>
                  <Text role="caption">{item}</Text>
                </Box>
              ))}
            </Stack>
          </Box>

          <Box
            padding="4"
            className={contentClass}
            data-overflow={overflow || undefined}
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
                    <Box key={name} padding="3" className={cardTileClass}>
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
                    tabIndex={0}
                    role="region"
                    aria-label="Long unbroken content"
                    className={longContentClass}
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

        <Box padding="3" className={footerClass} data-region="footer">
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

  if (state === 'compactDensity') {
    return <ThemeProvider density="compact">{body}</ThemeProvider>;
  }
  return body;
}
