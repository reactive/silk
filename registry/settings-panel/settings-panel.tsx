/**
 * SettingsPanel composite — synced from packages/silk/src/components/SettingsPanel.tsx
 * via scripts/sync-registry.mjs. Consumer-owned source; depends on @reactive/silk.
 */
import type {
  ComponentPropsWithoutRef,
  JSX,
  ReactNode,
  Ref,
} from 'react';
import { Children, Fragment } from 'react';
import { Card } from '@reactive/silk';
import { Heading } from '@reactive/silk';
import { Inline } from '@reactive/silk';
import { Separator } from '@reactive/silk';
import { Stack } from '@reactive/silk';
import { Text } from '@reactive/silk';

export interface SettingsPanelRootProps
  extends ComponentPropsWithoutRef<'section'> {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
}

function SettingsPanelRoot({
  className,
  children,
  ...props
}: SettingsPanelRootProps): JSX.Element {
  return (
    <Card asChild elevation="raised" radius="lg" className={className}>
      <section {...props}>
        <Stack gap="4" align="stretch">
          {children}
        </Stack>
      </section>
    </Card>
  );
}

export type SettingsPanelSectionProps = ComponentPropsWithoutRef<'section'> & {
  readonly ref?: Ref<HTMLElement>;
  readonly children?: ReactNode;
};

function SettingsPanelSection({
  children,
  ...props
}: SettingsPanelSectionProps): JSX.Element {
  const items = Children.toArray(children);
  return (
    <Stack asChild gap="0" align="stretch">
      <section {...props}>
        {items.map((child, index) => (
          <Fragment key={index}>
            {child}
            {index < items.length - 1 ? <Separator /> : null}
          </Fragment>
        ))}
      </section>
    </Stack>
  );
}

export type SettingsPanelSectionTitleProps = ComponentPropsWithoutRef<'h2'> & {
  readonly ref?: Ref<HTMLHeadingElement>;
  readonly children?: ReactNode;
};

function SettingsPanelSectionTitle({
  children,
  ...props
}: SettingsPanelSectionTitleProps): JSX.Element {
  return (
    <Heading
      level="2"
      size="sm"
      {...props}
      style={{ paddingBlockEnd: 'var(--silk-space-3)', ...props.style }}
    >
      {children}
    </Heading>
  );
}

export type SettingsPanelRowProps = ComponentPropsWithoutRef<'div'> & {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  /** `stack` for full-width fields; `inline` for label + control rows (switches). */
  readonly layout?: 'stack' | 'inline';
  readonly ref?: Ref<HTMLDivElement>;
  readonly children?: ReactNode;
};

function SettingsPanelRow({
  label,
  description,
  layout = 'stack',
  children,
  ...props
}: SettingsPanelRowProps): JSX.Element {
  const copy =
    label !== undefined || description !== undefined ? (
      <Stack gap="0" align="start">
        {label !== undefined ? (
          <Text role="label" tone="primary">
            {label}
          </Text>
        ) : null}
        {description !== undefined ? (
          <Text role="caption" tone="secondary">
            {description}
          </Text>
        ) : null}
      </Stack>
    ) : null;

  if (layout === 'inline') {
    return (
      <Inline
        gap="4"
        align="center"
        justify="between"
        wrap="wrap"
        {...props}
        style={{ paddingBlock: 'var(--silk-space-3)', ...props.style }}
      >
        {copy}
        {children}
      </Inline>
    );
  }

  return (
    <Stack
      gap="2"
      align="stretch"
      {...props}
      style={{ paddingBlock: 'var(--silk-space-3)', ...props.style }}
    >
      {copy}
      {children}
    </Stack>
  );
}

export interface SettingsPanelNamespace {
  readonly Root: typeof SettingsPanelRoot;
  readonly Section: typeof SettingsPanelSection;
  readonly SectionTitle: typeof SettingsPanelSectionTitle;
  readonly Row: typeof SettingsPanelRow;
}

export const SettingsPanel: SettingsPanelNamespace = {
  Root: SettingsPanelRoot,
  Section: SettingsPanelSection,
  SectionTitle: SettingsPanelSectionTitle,
  Row: SettingsPanelRow,
};
