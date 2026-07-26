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

type DocsSourceParameters = {
  readonly docs: {
    readonly source: {
      readonly type: 'dynamic';
      readonly transform: (code: string, context: SourceContext) => string;
    };
  };
};

/** Drop react-docgen injections if a `?raw` import still went through that loader. */
function cleanSource(source: string): string {
  const marker = '.__docgenInfo=';
  const index = source.indexOf(marker);
  if (index === -1) {
    return source.trimEnd();
  }
  // Docgen appends at EOF; cut from the statement start (optional leading `;`).
  const start = source.lastIndexOf(';', index);
  return source.slice(0, start === -1 ? index : start).trimEnd();
}

/**
 * Force Storybook's emit/transform path even for non-args stories. Without
 * `type: 'dynamic'`, CSF-only stories skip `docs.source.transform` and the
 * code panel never sees appended modules.
 */
function attachSources(
  preferOriginalSource: boolean,
  sources: readonly string[],
): DocsSourceParameters {
  const cleaned = sources.map(cleanSource);
  return {
    docs: {
      source: {
        type: 'dynamic',
        transform: (code: string, context: SourceContext): string => {
          const original = context.parameters?.docs?.source?.originalSource;
          const base =
            preferOriginalSource && original?.trim()
              ? original
              : code?.trim()
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
 * Prefer for fixtures and `*.demo.tsx` helpers so Show code stays drift-free.
 * Uses the live/dynamic snippet when available (args-accurate).
 */
export function withSource(...sources: readonly string[]): DocsSourceParameters {
  return attachSources(false, sources);
}

/**
 * Prefer static CSF source plus supporting modules — use when the dynamic
 * serializer loses information (e.g. VariantMatrix function children).
 */
export function withStaticSource(
  ...sources: readonly string[]
): DocsSourceParameters {
  return attachSources(true, sources);
}

/** Ready-made parameters for cross-product matrix stories. */
export const matrixSource: DocsSourceParameters =
  withStaticSource(variantMatrixSource);
