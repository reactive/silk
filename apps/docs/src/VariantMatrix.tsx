import { Box, Text } from '@reactive/silk';
import { Fragment, type CSSProperties, type JSX, type ReactNode } from 'react';

interface VariantMatrixProps<Row extends string, Column extends string> {
  readonly rows: readonly Row[];
  readonly columns: readonly Column[];
  readonly align?: CSSProperties['alignItems'];
  readonly columnWidth?: string;
  readonly children: (row: Row, column: Column) => ReactNode;
}

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
    <Box
      style={{
        display: 'grid',
        gap: 'var(--silk-space-3) var(--silk-space-5)',
        gridTemplateColumns: `max-content repeat(${columns.length}, ${columnWidth})`,
        alignItems: align,
      }}
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
    </Box>
  );
}
