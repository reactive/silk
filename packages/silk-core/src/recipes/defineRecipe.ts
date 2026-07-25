/**
 * Contract-only recipe helper. Renderers own styling; recipes share
 * variant vocabulary and defaults across platforms.
 */

export type VariantDefinitions = Readonly<Record<string, readonly string[]>>;

export type Recipe<V extends VariantDefinitions> = {
  readonly variants: V;
  readonly defaults: { readonly [K in keyof V]: V[K][number] };
};

export function defineRecipe<const V extends VariantDefinitions>(
  recipe: Recipe<V>,
): Recipe<V> {
  return recipe;
}

export type VariantProps<R extends Recipe<VariantDefinitions>> = {
  readonly [K in keyof R['variants']]?: R['variants'][K][number];
};
