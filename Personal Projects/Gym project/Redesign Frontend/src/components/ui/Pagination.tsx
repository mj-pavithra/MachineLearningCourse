import {
  HStack,
  Text,
  NativeSelect,
  Box,
  IconButton,
} from '@chakra-ui/react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { ModernButton } from './ModernButton';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSizeSelector = false,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    }
    // Reset to first page when page size changes
    onPageChange(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(totalPages - 3, 2);
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalPages === 0) {
    return null;
  }

  return (
    <Box
      display="flex"
      flexDirection={{ base: 'column', md: 'row' }}
      justifyContent="space-between"
      alignItems="center"
      gap={{ base: 3, md: 4 }}
      py={{ base: 3, md: 4 }}
    >
      <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600">
        Showing {startItem} to {endItem} of {totalItems} results
      </Text>

      <HStack gap={2}>
        {showPageSizeSelector && onPageSizeChange && (
          <HStack gap={2}>
            <Text fontSize="sm">Show:</Text>
            <NativeSelect.Root size="sm" w="80px">
              <NativeSelect.Field
                value={pageSize}
                onChange={handlePageSizeChange}
                aria-label="Items per page"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </HStack>
        )}

        <HStack gap={1}>
          <IconButton
            aria-label="Previous page"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            variant="outline"
          >
            <BsChevronLeft />
          </IconButton>

          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <Text key={`ellipsis-${index}`} px={2} color="gray.500">
                  ...
                </Text>
              );
            }

            const pageNum = page as number;
            return (
              <ModernButton
                key={pageNum}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                variant={currentPage === pageNum ? 'solid' : 'outline'}
                colorPalette={currentPage === pageNum ? 'blue' : 'gray'}
                aria-label={`Go to page ${pageNum}`}
                aria-current={currentPage === pageNum ? 'page' : undefined}
              >
                {pageNum}
              </ModernButton>
            );
          })}

          <IconButton
            aria-label="Next page"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            <BsChevronRight />
          </IconButton>
        </HStack>
      </HStack>
    </Box>
  );
}

