import {
  createTheme,
  generatePairedPalette,
  type ColorScheme,
  type DensityName,
} from '@reactive/silk-core';
import {
  Badge,
  Card,
  Checkbox,
  Field,
  Heading,
  Inline,
  Input,
  Progress,
  RadioGroup,
  Separator,
  SilkProvider,
  Skeleton,
  Spinner,
  Stack,
  StatusDot,
  Switch,
  Text,
  Textarea,
} from '@reactive/silk-native';
import { useMemo, useState, type JSX } from 'react';

export const nativeSettingsFormStates = [
  'normal',
  'error',
  'disabled',
  'invalidDisabled',
  'compact',
  'dark',
  'reducedMotion',
  'longContent',
  'rtl',
  'indeterminate',
] as const;

export type NativeSettingsFormState =
  (typeof nativeSettingsFormStates)[number];

const paired = generatePairedPalette('#0ea5e9');
const longBio = Array.from({ length: 80 }, () => 'content').join(' ');

export interface NativeSettingsFormProps {
  readonly state?: NativeSettingsFormState;
}

/**
 * Native forms fixture — state matrix for docs + tests (RNW).
 * Slider is deferred; Progress stands in for determinate feedback.
 */
export function NativeSettingsForm({
  state = 'normal',
}: NativeSettingsFormProps): JSX.Element {
  const scheme: ColorScheme = state === 'dark' ? 'dark' : 'light';
  const density: DensityName = state === 'compact' ? 'compact' : 'comfortable';
  const disabled = state === 'disabled' || state === 'invalidDisabled';
  const invalid = state === 'error' || state === 'invalidDisabled';
  const dir = state === 'rtl' ? 'rtl' : 'ltr';

  const theme = useMemo(
    () =>
      createTheme({
        colorScheme: scheme,
        ...(state === 'dark' ? { palette: paired.dark } : {}),
      }),
    [scheme, state],
  );

  const [notify, setNotify] = useState(true);
  const [plan, setPlan] = useState('pro');
  const [selectAll, setSelectAll] = useState<boolean | 'indeterminate'>(
    state === 'indeterminate' ? 'indeterminate' : false,
  );

  return (
    <div
      data-fixture="native-settings-form"
      data-fixture-state={state}
      dir={dir}
    >
      <SilkProvider theme={theme} density={density}>
        <Card padding="4" elevation="raised" testID="settings-card">
          <Stack gap="4">
            <Inline gap="2" align="center">
              <Heading level="2">Settings</Heading>
              <Badge tone={invalid ? 'danger' : 'accent'}>
                {invalid ? 'needs attention' : 'native'}
              </Badge>
              <StatusDot tone={invalid ? 'danger' : 'success'} />
            </Inline>

            <Text tone="secondary" testID="settings-summary">
              state={state} · scheme={scheme} · density={density} · dir={dir}
            </Text>

            {state === 'reducedMotion' ? (
              <div data-region="reduced-motion">
                <Inline gap="3" align="center">
                  <Skeleton shape="text" style={{ flex: 1 }} />
                  <Spinner label="Saving" />
                </Inline>
                <Text role="caption" tone="secondary">
                  reduced-motion: skeleton static / spinner dotted when OS prefers
                </Text>
              </div>
            ) : null}

            <Separator />

            <Field.Root
              invalid={invalid}
              disabled={disabled}
              required
              controlId="settings-name"
            >
              <Field.Label>Display name</Field.Label>
              <Input
                placeholder="Ada Lovelace"
                defaultValue={state === 'longContent' ? longBio.slice(0, 40) : ''}
                testID="settings-name"
              />
              <Field.Description>Shown on your profile.</Field.Description>
              {invalid ? (
                <Field.Error>Display name is required.</Field.Error>
              ) : null}
            </Field.Root>

            <Field.Root disabled={disabled} controlId="settings-bio">
              <Field.Label>Bio</Field.Label>
              <Textarea
                defaultValue={state === 'longContent' ? longBio : ''}
                testID="settings-bio"
              />
            </Field.Root>

            <Field.Root
              mode="group"
              orientation="horizontal"
              disabled={disabled}
            >
              <Checkbox
                checked={selectAll}
                onCheckedChange={setSelectAll}
                accessibilityLabel="Select all"
                disabled={disabled}
                testID="settings-select-all"
              />
              <Field.Label>Select all notifications</Field.Label>
            </Field.Root>

            <Field.Root
              mode="group"
              orientation="horizontal"
              disabled={disabled}
            >
              <Switch
                checked={notify}
                onCheckedChange={setNotify}
                accessibilityLabel="Email notifications"
                disabled={disabled}
                testID="settings-notify"
              />
              <Field.Label>Email notifications</Field.Label>
            </Field.Root>

            <Field.Root mode="group" disabled={disabled}>
              <Field.Label>Plan</Field.Label>
              <RadioGroup.Root
                value={plan}
                onValueChange={setPlan}
                disabled={disabled}
                accessibilityLabel="Plan"
              >
                <RadioGroup.Item value="free">Free</RadioGroup.Item>
                <RadioGroup.Item value="pro">Pro</RadioGroup.Item>
              </RadioGroup.Root>
            </Field.Root>

            <div data-region="progress">
              <Text role="label">Profile completeness</Text>
              <Progress
                value={invalid ? 20 : 72}
                label="Profile completeness"
                testID="settings-progress"
              />
            </div>

            {state === 'longContent' ? (
              <div data-region="long-content">
                <Text measure="prose">{longBio}</Text>
              </div>
            ) : null}
          </Stack>
        </Card>
      </SilkProvider>
    </div>
  );
}
