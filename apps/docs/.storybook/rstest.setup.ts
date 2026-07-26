import { beforeAll } from '@rstest/core';
import { setProjectAnnotations } from 'storybook-react-rsbuild';
import * as previewAnnotations from './preview';

const annotations = setProjectAnnotations([previewAnnotations]);

beforeAll(async () => {
  // Storybook's beforeAll may return a cleanup callback whose type does not
  // match rstest's BeforeAllListener — run setup only.
  await annotations.beforeAll?.();
});
