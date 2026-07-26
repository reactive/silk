import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Absolute paths to registry item source files (`*.ts(x)`, `*.css.ts`). */
export function listRegistrySources(repoRoot: string): readonly string[] {
  const registryDir = join(repoRoot, 'registry');
  return readdirSync(registryDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) =>
      readdirSync(join(registryDir, entry.name))
        .filter((file) => /\.(tsx?|css\.ts)$/.test(file))
        .map((file) => join(registryDir, entry.name, file)),
    );
}
