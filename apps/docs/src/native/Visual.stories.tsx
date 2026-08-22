import {
  avatarRecipe,
  badgeRecipe,
  cardRecipe,
  headingRecipe,
  progressRecipe,
  surfaceRecipe,
} from '@reactive/silk-core';
import {
  Avatar,
  Badge,
  Card,
  Heading,
  Progress,
  Separator,
  Skeleton,
  Spinner,
  StatusDot,
  Surface,
  Text,
} from '@reactive/silk-native';
import type { Meta, StoryObj } from 'storybook-react-rsbuild';
import { withNativeSilk } from './withNativeSilk';

const meta = {
  title: 'Native Components/Visual',
  decorators: [withNativeSilk],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const SurfaceElevations: Story = {
  render: () => (
    <>
      {surfaceRecipe.variants.elevation.map((elevation) => (
        <Surface
          key={elevation}
          elevation={elevation}
          border="subtle"
          style={{ padding: 12, marginBottom: 8 }}
        >
          <Text>elevation={elevation}</Text>
        </Surface>
      ))}
    </>
  ),
};

export const CardInteractive: Story = {
  render: () => (
    <Card
      elevation={cardRecipe.defaults.elevation}
      padding="4"
      interactive="true"
      onPress={() => undefined}
    >
      <Heading level="3">Card</Heading>
      <Text tone="secondary">Pressable when onPress is provided.</Text>
      <Badge tone="accent">featured</Badge>
    </Card>
  ),
};

export const HeadingSizes: Story = {
  render: () => (
    <>
      {headingRecipe.variants.size.map((size) => (
        <Heading key={size} size={size}>
          Heading {size}
        </Heading>
      ))}
    </>
  ),
};

export const BadgesAndDots: Story = {
  render: () => (
    <>
      {badgeRecipe.variants.tone.map((tone) => (
        <Badge key={tone} tone={tone} style={{ marginRight: 8, marginBottom: 8 }}>
          {tone}
        </Badge>
      ))}
      {badgeRecipe.variants.tone.map((tone) => (
        <StatusDot key={`dot-${tone}`} tone={tone} style={{ marginRight: 8 }} />
      ))}
    </>
  ),
};

export const AvatarMatrix: Story = {
  render: () => (
    <>
      {avatarRecipe.variants.size.map((size) => (
        <Avatar
          key={size}
          size={size}
          fallback={size.toUpperCase()}
          style={{ marginRight: 8 }}
        />
      ))}
      <Separator style={{ marginVertical: 12 }} />
      <Skeleton shape="text" style={{ marginBottom: 8 }} />
      <Skeleton shape="rect" style={{ marginBottom: 8 }} />
      <Spinner label="Loading demo" />
    </>
  ),
};

export const ProgressStates: Story = {
  render: () => (
    <>
      {progressRecipe.variants.size.map((size) => (
        <Progress
          key={size}
          size={size}
          value={60}
          label={`Progress ${size}`}
          style={{ marginBottom: 12 }}
        />
      ))}
      <Progress label="Indeterminate" style={{ marginTop: 8 }} />
    </>
  ),
};
