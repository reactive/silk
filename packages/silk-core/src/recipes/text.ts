import {
  defineRecipe,
  type Recipe,
  type VariantProps,
} from './defineRecipe.js';

const textVariants = {
  role: [
    'body',
    'bodySm',
    'heading',
    'headingLg',
    'label',
    'caption',
  ] as const,
  tone: ['primary', 'secondary', 'accent', 'danger'] as const,
};

export const textRecipe: Recipe<typeof textVariants> = defineRecipe({
  variants: textVariants,
  defaults: {
    role: 'body',
    tone: 'primary',
  },
});

export type TextVariantProps = VariantProps<typeof textRecipe>;
