import { styled } from '@linaria/react';
import { Box, Text } from '@reactive/silk';
import { Fragment, type JSX, type ReactNode } from 'react';

interface VariantMatrixProps<Row extends string, Column extends string> {
  readonly rows: readonly Row[];
  readonly columns: readonly Column[];
  readonly align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  readonly columnWidth?: string;
  readonly children: (row: Row, column: Column) => ReactNode;
}

const Matrix = styled(Box)`
  display: grid;
  gap: var(--silk-space-3) var(--silk-space-5);
  grid-template-columns: max-content repeat(
    ${(props) =>
      (props as { readonly 'data-column-count': number })['data-column-count']},
    ${(props) =>
      (props as { readonly 'data-column-width': string })['data-column-width']}
  );
  align-items: ${(props) =>
    (props as { readonly 'data-align': string })['data-align']};
`;

/**
 * Labelled grid for cross-product variant stories. Not a Silk API — docs
 * plumbing shared by the recipe matrices.
 */
export function VariantMatrix<Row extends string, Column extends string>({
  rows,
  columns,
  align = 'center',
  columnWidth = 'max-content',
  children,
}: VariantMatrixProps<Row, Column>): JSX.Element {
  return (
    <Matrix
      data-column-count={columns.length}
      data-column-width={columnWidth}
      data-align={align}
    >
      <span />
      {columns.map((column) => (
        <Text key={column} role="label">
          {column}
        </Text>
      ))}
      {rows.map((row) => (
        <Fragment key={row}>
          <Text role="label">{row}</Text>
          {columns.map((column) => (
            <Fragment key={`${row}-${column}`}>{children(row, column)}</Fragment>
          ))}
        </Fragment>
      ))}
    </Matrix>
  );
}
