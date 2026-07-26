import { describe, test } from '@rstest/core';
import { composeStories } from 'storybook-react-rsbuild';

type StoryModule = Parameters<typeof composeStories>[0];
type RunnableStory = {
  readonly tags?: readonly string[];
  run: () => Promise<unknown>;
};

// Same discovery shape as apps/docs/.storybook/main.ts stories glob.
const storyModules = import.meta.glob('../**/*.stories.tsx', {
  eager: true,
}) as Record<string, StoryModule>;

for (const [path, storyModule] of Object.entries(storyModules)) {
  const composed = composeStories(storyModule) as Record<string, RunnableStory>;
  const stories = Object.entries(composed).filter(([, Story]) =>
    Story.tags?.includes('test'),
  );
  if (stories.length === 0) {
    continue;
  }

  const moduleName = path.replace(/^\.\.\//, '').replace(/\.stories\.tsx$/, '');

  describe(`portable stories: ${moduleName}`, () => {
    for (const [storyName, Story] of stories) {
      // Mount + play only — browser a11y is gated by @storybook/test-runner.
      test(`${storyName} mounts`, async () => {
        await Story.run();
      });
    }
  });
}
