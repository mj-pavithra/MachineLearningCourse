import {
  Table,
  Box,
  Skeleton,
  Text,
  Center,
} from '@chakra-ui/react';
import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

// Export alias for backward compatibility
export type DataTableColumn<T> = Column<T>;

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  ariaLabel?: string;
}

export function DataTable<T extends { _id?: string; id?: string; packageId?: string }>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  ariaLabel = 'Data table',
}: DataTableProps<T>) {
  const getRowId = (row: T): string => {
    return (row as any).packageId || row._id || row.id || String(Math.random());
  };

  if (isLoading) {
    return (
      <Box overflowX="auto">
        <Table.Root variant="outline" aria-label={ariaLabel}>
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.ColumnHeader key={column.key} width={column.width}>
                  {column.header}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[1, 2, 3, 4, 5].map((i) => (
              <Table.Row key={i}>
                {columns.map((column) => (
                  <Table.Cell key={column.key}>
                    <Skeleton height="20px" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box overflowX="auto">
        <Table.Root variant="outline" aria-label={ariaLabel}>
          <Table.Header>
            <Table.Row>
              {columns.map((column) => (
                <Table.ColumnHeader key={column.key} width={column.width}>
                  {column.header}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={columns.length}>
                <Center py={8}>
                  <Text color="gray.500">{emptyMessage}</Text>
                </Center>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Box>
    );
  }

  return (
    <Box overflowX="auto">
      <Table.Root variant="line" aria-label={ariaLabel}>
        <Table.Header>
          <Table.Row>
            {columns.map((column) => (
              <Table.ColumnHeader key={column.key} width={column.width}>
                {column.header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map((row) => {
            const rowId = getRowId(row);
            return (
              <Table.Row
                key={rowId}
                onClick={() => onRowClick?.(row)}
                cursor={onRowClick ? 'pointer' : 'default'}
                _hover={onRowClick ? { bg: 'gray.50' } : {}}
                role="row"
              >
                {columns.map((column) => {
                  const content = column.render
                    ? column.render(row)
                    : column.accessor
                    ? column.accessor(row)
                    : (row as any)[column.key];

                  return (
                    <Table.Cell key={column.key} role="gridcell">
                      {content ?? '-'}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

