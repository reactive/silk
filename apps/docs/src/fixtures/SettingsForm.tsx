import { css } from '@linaria/core';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Heading,
  Inline,
  Input,
  Progress,
  RadioGroup,
  Separator,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Switch,
  Text,
  Textarea,
} from '@reactive/silk';
import { useState, type JSX } from 'react';

export type SettingsFormState =
  | 'normal'
  | 'error'
  | 'disabled'
  | 'loading'
  | 'reducedMotion'
  | 'narrowLongContent';

export interface SettingsFormProps {
  readonly state?: SettingsFormState;
}

// Width constraint only — Card supplies the surface, border, and elevation.
const shellClass: string = css`
  max-width: 36rem;

  &[data-narrow] {
    max-width: 18rem;
  }
`;

/**
 * Stage 2 exit fixture — settings form composed from Silk visual + form primitives.
 */
export function SettingsForm({
  state = 'normal',
}: SettingsFormProps): JSX.Element {
  const invalid = state === 'error';
  const disabled = state === 'disabled';
  const loading = state === 'loading';
  const reducedMotion = state === 'reducedMotion';
  const narrowLongContent = state === 'narrowLongContent';
  const [digestDays, setDigestDays] = useState(3);

  return (
    <div
      data-fixture="settings-form"
      data-fixture-state={state}
      data-narrow={narrowLongContent || undefined}
      className={shellClass}
    >
      <Card elevation="raised" padding="5" radius="lg">
        <Stack gap="4">
          <Inline gap="2" align="center" justify="between">
            <Heading level="2" size="lg">
              Account settings
            </Heading>
            <Badge tone="accent" variant="soft">
              Beta
            </Badge>
          </Inline>

          <Text tone="secondary">
            {narrowLongContent
              ? 'Update your profile, notification preferences, and privacy controls. Extremely long helper copy should wrap cleanly without breaking the layout rhythm or overlapping controls.'
              : 'Update your profile and notification preferences.'}
          </Text>

          {loading ? (
            <Stack gap="3" data-region="loading">
              <Skeleton shape="text" />
              <Skeleton shape="rect" />
              <Inline gap="2" align="center">
                <Spinner label="Saving settings" />
                <Text tone="secondary">Saving…</Text>
              </Inline>
              <Progress label="Saving progress" />
            </Stack>
          ) : (
            <Stack gap="4" data-region="form">
              <Field.Root invalid={invalid} disabled={disabled} required>
                <Field.Label>Display name</Field.Label>
                <Input
                  defaultValue={invalid ? '' : 'Ada Lovelace'}
                  placeholder="Your name"
                />
                <Field.Description>
                  {narrowLongContent
                    ? 'This name appears on your public profile, in notifications, and anywhere teammates mention you across the workspace.'
                    : 'Shown on your public profile.'}
                </Field.Description>
                {invalid ? (
                  <Field.Error>
                    {narrowLongContent
                      ? 'Display name is required and must be at least two characters after trimming whitespace from both ends.'
                      : 'Display name is required.'}
                  </Field.Error>
                ) : null}
              </Field.Root>

              <Field.Root disabled={disabled}>
                <Field.Label>Bio</Field.Label>
                <Textarea
                  defaultValue="Mathematician and writer."
                  rows={3}
                />
              </Field.Root>

              <Separator />

              <Field.Root mode="group" disabled={disabled}>
                <Field.Label>Plan</Field.Label>
                <RadioGroup.Root defaultValue="pro">
                  <RadioGroup.Item value="free">Free</RadioGroup.Item>
                  <RadioGroup.Item value="pro">Pro</RadioGroup.Item>
                  <RadioGroup.Item value="team">Team</RadioGroup.Item>
                </RadioGroup.Root>
              </Field.Root>

              <Field.Root disabled={disabled} controlId="marketing">
                <Inline gap="2" align="center">
                  <Checkbox defaultChecked />
                  <Field.Label>Email me product updates</Field.Label>
                </Inline>
              </Field.Root>

              <Field.Root disabled={disabled}>
                <Inline gap="2" align="center" justify="between">
                  <Field.Label>Dark mode</Field.Label>
                  <Switch aria-label="Dark mode" />
                </Inline>
              </Field.Root>

              <Field.Root disabled={disabled}>
                <Field.Label>Digest frequency</Field.Label>
                <Slider
                  value={[digestDays]}
                  onValueChange={([days]) => {
                    if (days !== undefined) setDigestDays(days);
                  }}
                  min={1}
                  max={7}
                  aria-label="Digest frequency"
                  aria-valuetext={`${digestDays} days`}
                />
                <Field.Description>Days between email digests.</Field.Description>
              </Field.Root>

              <Progress
                value={invalid ? 35 : 80}
                tone="success"
                label="Profile completion"
              />

              <Inline gap="2" justify="end">
                <Button variant="ghost" tone="neutral" disabled={disabled}>
                  Cancel
                </Button>
                <Button tone="accent" disabled={disabled}>
                  Save changes
                </Button>
              </Inline>
            </Stack>
          )}

          {reducedMotion ? (
            <Stack gap="3" data-region="reduced-motion-preview">
              <Text tone="secondary">
                Motion preview for prefers-reduced-motion (Skeleton, Spinner,
                indeterminate Progress).
              </Text>
              <Skeleton shape="text" />
              <Skeleton shape="rect" />
              <Inline gap="2" align="center">
                <Spinner label="Reduced-motion spinner preview" />
                <Text tone="secondary">Indeterminate motion</Text>
              </Inline>
              <Progress label="Reduced-motion progress preview" />
            </Stack>
          ) : null}
        </Stack>
      </Card>
    </div>
  );
}
