import variantMatrixSource from './VariantMatrix.tsx?raw';

type SourceContext = {
  readonly parameters?: {
    readonly docs?: {
      readonly source?: {
        readonly originalSource?: string;
      };
    };
  };
};

export type DocsSourceParameters = {
  readonly docs: {
    readonly source: {
      readonly type: 'dynamic';
      readonly transform: (code: string, context: SourceContext) => string;
    };
  };
};

function attachSources(
  preferOriginalSource: boolean,
  sources: readonly string[],
): DocsSourceParameters {
  const cleaned = sources.map((source) => source.trimEnd());
  return {
    docs: {
      source: {
        // Force Storybook's emit path so transforms run for non-args stories.
        type: 'dynamic',
        transform: (code: string, context: SourceContext): string => {
          const original = context.parameters?.docs?.source?.originalSource;
          const base =
            preferOriginalSource && original != null && original.trim() !== ''
              ? original
              : code.trim() !== ''
                ? code
                : (original ?? '');
          return [base, ...cleaned].join('\n\n');
        },
      },
    },
  };
}

/**
 * Append supporting module source beneath a story's snippet in the code panel.
 * Prefer for fixtures and extracted helpers so Show code stays drift-free.
 */
export function withSource(...sources: readonly string[]): DocsSourceParameters {
  return attachSources(false, sources);
}

/** Ready-made parameters for cross-product matrix stories (CSF + VariantMatrix). */
export const matrixSource: DocsSourceParameters = attachSources(
  true,
  [variantMatrixSource],
);
