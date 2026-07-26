import { css } from '@linaria/core';
import { styled } from '@linaria/react';
import {
  Accordion,
  Button,
  Card,
  DropdownMenu,
  Heading,
  Inline,
  ScrollArea,
  Select,
  Stack,
  Tabs,
  Text,
  Toast,
  Tooltip,
  SilkProvider,
} from '@reactive/silk';
import { useState, type JSX } from 'react';

export type InspectorPanelState =
  | 'normal'
  | 'overlaysOpen'
  | 'longContent'
  | 'reducedMotion'
  | 'nestedTheme'
  | 'multipleToasts';

export interface InspectorPanelProps {
  readonly state?: InspectorPanelState;
}

const shellClass: string = css`
  max-width: 42rem;
`;

const ScrollFrame = styled(ScrollArea)`
  height: 80px;
  border: 1px solid var(--silk-color-border-subtle);
  border-radius: var(--silk-radius-md);

  &[data-long] {
    height: 120px;
  }
`;

const ScrollPad = styled.div`
  padding: var(--silk-space-3);
`;

const SHORT_ROWS = ['Short list item 1', 'Short list item 2'] as const;
const LONG_ROWS = Array.from(
  { length: 24 },
  (_, i) => `Overflow row ${i + 1}`,
);

function OverlayControls({
  overlaysOpen,
}: {
  readonly overlaysOpen: boolean;
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(overlaysOpen);
  const [selectOpen, setSelectOpen] = useState(overlaysOpen);
  const [prevOverlaysOpen, setPrevOverlaysOpen] = useState(overlaysOpen);

  if (prevOverlaysOpen !== overlaysOpen) {
    setPrevOverlaysOpen(overlaysOpen);
    setMenuOpen(overlaysOpen);
    setSelectOpen(overlaysOpen);
  }

  return (
    <Stack gap="3" data-region="general">
      <Text tone="secondary" measure="prose">
        Compose Tabs, Select, menus, and toast feedback.
      </Text>
      <Select.Root
        open={selectOpen}
        onOpenChange={setSelectOpen}
        defaultValue="preview"
      >
        <Select.Trigger aria-label="Mode">
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="preview">Preview</Select.Item>
          <Select.Item value="edit">Edit</Select.Item>
          <Select.Item value="publish">Publish</Select.Item>
        </Select.Content>
      </Select.Root>

      <DropdownMenu.Root
        open={menuOpen}
        onOpenChange={setMenuOpen}
        modal={!overlaysOpen}
      >
        <DropdownMenu.Trigger asChild>
          <Button variant="soft">Actions</Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
          <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
          <DropdownMenu.Item tone="danger">Delete</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Stack>
  );
}

function FixtureTooltip({
  overlaysOpen,
}: {
  readonly overlaysOpen: boolean;
}): JSX.Element {
  const [open, setOpen] = useState(overlaysOpen);
  const [prevOverlaysOpen, setPrevOverlaysOpen] = useState(overlaysOpen);

  if (prevOverlaysOpen !== overlaysOpen) {
    setPrevOverlaysOpen(overlaysOpen);
    setOpen(overlaysOpen);
  }

  return (
    <Tooltip.Root open={open} onOpenChange={setOpen}>
      <Tooltip.Trigger asChild>
        <Button size="sm" variant="outline">
          Help
        </Button>
      </Tooltip.Trigger>
      <Tooltip.Content>Inspector help tip</Tooltip.Content>
    </Tooltip.Root>
  );
}

function FixtureToasts({
  overlaysOpen,
  multipleToasts,
}: {
  readonly overlaysOpen: boolean;
  readonly multipleToasts: boolean;
}): JSX.Element {
  const primaryOpen = overlaysOpen || multipleToasts;
  const [toastOpen, setToastOpen] = useState(primaryOpen);
  const [toastTwoOpen, setToastTwoOpen] = useState(multipleToasts);
  const [prevPrimaryOpen, setPrevPrimaryOpen] = useState(primaryOpen);
  const [prevMultipleToasts, setPrevMultipleToasts] = useState(multipleToasts);

  if (prevPrimaryOpen !== primaryOpen) {
    setPrevPrimaryOpen(primaryOpen);
    setToastOpen(primaryOpen);
  }
  if (prevMultipleToasts !== multipleToasts) {
    setPrevMultipleToasts(multipleToasts);
    setToastTwoOpen(multipleToasts);
  }

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        tone="success"
        duration={Number.POSITIVE_INFINITY}
      >
        <Toast.Title>Primary toast</Toast.Title>
        <Toast.Description>Inspector saved.</Toast.Description>
        <Toast.Close aria-label="Dismiss primary toast" />
      </Toast.Root>
      {multipleToasts ? (
        <Toast.Root
          open={toastTwoOpen}
          onOpenChange={setToastTwoOpen}
          tone="danger"
          duration={Number.POSITIVE_INFINITY}
        >
          <Toast.Title>Secondary toast</Toast.Title>
          <Toast.Description>Validation warning.</Toast.Description>
          <Toast.Close aria-label="Dismiss secondary toast" />
        </Toast.Root>
      ) : null}
      <Toast.Viewport />
    </Toast.Provider>
  );
}

/**
 * Stage 3 exit fixture — overlay state is isolated so toggles do not re-render
 * Tabs/Accordion/ScrollArea. Query portaled content from `document.body`.
 */
export function InspectorPanel({
  state = 'normal',
}: InspectorPanelProps): JSX.Element {
  const overlaysOpen = state === 'overlaysOpen';
  const longContent = state === 'longContent';
  const multipleToasts = state === 'multipleToasts';
  const nestedTheme = state === 'nestedTheme';
  const rows = longContent ? LONG_ROWS : SHORT_ROWS;

  const panel = (
    <Tooltip.Provider delayDuration={0}>
      <div
        data-fixture="inspector-panel"
        data-fixture-state={state}
        className={shellClass}
      >
        <Card elevation="raised" padding="5" radius="lg">
          <Stack gap="4">
            <Inline gap="2" align="center" justify="between">
              <Heading level="2" size="lg">
                Inspector
              </Heading>
              <FixtureTooltip overlaysOpen={overlaysOpen} />
            </Inline>

            <Tabs.Root defaultValue="general" variant="line">
              <Tabs.List>
                <Tabs.Trigger value="general">General</Tabs.Trigger>
                <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="general">
                <OverlayControls overlaysOpen={overlaysOpen} />
              </Tabs.Content>
              <Tabs.Content value="advanced">
                <Accordion.Root type="single" collapsible defaultValue="a">
                  <Accordion.Item value="a">
                    <Accordion.Header>
                      <Accordion.Trigger>Details</Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content>
                      <Text>Advanced accordion body.</Text>
                    </Accordion.Content>
                  </Accordion.Item>
                  <Accordion.Item value="b">
                    <Accordion.Header>
                      <Accordion.Trigger>History</Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content>
                      <Text>Revision history placeholder.</Text>
                    </Accordion.Content>
                  </Accordion.Item>
                </Accordion.Root>
              </Tabs.Content>
            </Tabs.Root>

            <div data-region="scroll">
              <ScrollFrame data-long={longContent || undefined}>
                <ScrollPad>
                  {rows.map((line) => (
                    <Text key={line}>{line}</Text>
                  ))}
                </ScrollPad>
              </ScrollFrame>
            </div>

            {state === 'reducedMotion' ? (
              <Text data-region="reduced-motion" tone="secondary">
                Reduced-motion state: overlays still mount; animations gated by
                prefers-reduced-motion (mock matchMedia in unit tests).
              </Text>
            ) : null}
          </Stack>
        </Card>

        <FixtureToasts
          overlaysOpen={overlaysOpen}
          multipleToasts={multipleToasts}
        />
      </div>
    </Tooltip.Provider>
  );

  if (nestedTheme) {
    return (
      <div data-region="nested-theme">
        <SilkProvider colorScheme="dark">{panel}</SilkProvider>
      </div>
    );
  }

  return panel;
}
