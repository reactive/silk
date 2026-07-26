import type { TypographyRole } from '@reactive/silk-core';

/** Typography role → `--silk-typography-*` name segment. */
export const typographyRoleVarKey: Readonly<Record<TypographyRole, string>> = {
  body: 'body',
  bodySm: 'body-sm',
  headingSm: 'heading-sm',
  heading: 'heading',
  headingLg: 'heading-lg',
  headingXl: 'heading-xl',
  label: 'label',
  caption: 'caption',
};

/** Every typography role — exhaustive because `typographyRoleVarKey` is a full Record. */
export const typographyRoles: readonly TypographyRole[] = Object.keys(
  typographyRoleVarKey,
) as TypographyRole[];

/** Declaration block binding one typography role to its semantic tokens. */
export function typographyRoleCss(role: TypographyRole): string {
  const key = typographyRoleVarKey[role];
  return `
    font-family: var(--silk-typography-${key}-family);
    font-size: var(--silk-typography-${key}-size);
    line-height: var(--silk-typography-${key}-line-height);
    font-weight: var(--silk-typography-${key}-weight);
  `;
}
