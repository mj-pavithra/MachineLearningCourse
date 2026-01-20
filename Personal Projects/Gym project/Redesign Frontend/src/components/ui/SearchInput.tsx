import { Input, IconButton, Box } from '@chakra-ui/react';
import { BsSearch, BsX } from 'react-icons/bs';
import { useState, useEffect, ChangeEvent, useRef, useImperativeHandle, forwardRef, KeyboardEvent } from 'react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onDebouncedChange?: (value: string) => void;
  debounceDelay?: number;
  isLoading?: boolean;
  minLength?: number; // Minimum characters before triggering search
  showEnterHint?: boolean; // Show "Press Enter to search" hint
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  placeholder = 'Search...',
  value,
  onChange,
  onDebouncedChange,
  debounceDelay: _debounceDelay = 2000, // Kept for backward compatibility but unused (search is manual only)
  isLoading = false,
  minLength = 2,
  showEnterHint = true,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const [showHint, setShowHint] = useState(false);
  // Note: debounceDelay prop kept for backward compatibility but not used (search is manual only)

  // Expose input ref to parent
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Sync local value with external value changes (only when external value actually changes)
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setLocalValue(value);
    }
  }, [value]);

  // Note: Automatic debounced search removed - search only triggers on Enter key or Clear button

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
    // Always show hint when user has typed enough characters
    if (newValue.length >= minLength && showEnterHint) {
      setShowHint(true);
    } else {
      setShowHint(false);
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setShowHint(false);
    if (onDebouncedChange) {
      onDebouncedChange('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onDebouncedChange) {
      // Trigger immediate search on Enter key
      if (localValue.length === 0 || localValue.length >= minLength) {
        onDebouncedChange(localValue);
        setShowHint(false);
      }
    }
  };

  return (
    <Box position="relative" width="100%">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <Box position="absolute" left={{ base: '14px', md: '12px' }} top="50%" transform="translateY(-50%)" pointerEvents="none" zIndex={1}>
        {isLoading ? (
          <Box
            as="span"
            display="inline-block"
            width={{ base: '18px', md: '16px' }}
            height={{ base: '18px', md: '16px' }}
            border="2px solid"
            borderColor="blue.500"
            borderTopColor="transparent"
            borderRadius="full"
            style={{ animation: 'spin 0.6s linear infinite' }}
          />
        ) : (
          <Box fontSize={{ base: 'lg', md: 'md' }} color="gray.500">
            <BsSearch />
          </Box>
        )}
      </Box>
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label="Search input"
        disabled={isLoading}
        h={{ base: '44px', md: 'auto' }}
        fontSize={{ base: 'md', md: 'sm' }}
        pl={{ base: '44px', md: '40px' }}
        pr={localValue ? { base: '44px', md: '40px' } : { base: '16px', md: '12px' }}
        borderWidth="1px"
        borderColor={{ base: 'gray.400', md: 'gray.300' }}
        _hover={{
          borderColor: { base: 'gray.500', md: 'gray.400' },
        }}
        _focus={{
          borderColor: 'blue.500',
          boxShadow: '0 0 0 2px var(--chakra-colors-blue-500)',
        }}
        transition="all 0.2s"
      />
      {localValue && (
        <Box position="absolute" right={{ base: '6px', md: '4px' }} top="50%" transform="translateY(-50%)" zIndex={1}>
          <IconButton
            aria-label="Clear search"
            size="sm"
            variant="ghost"
            onClick={handleClear}
            h={{ base: '36px', md: '1.75rem' }}
            w={{ base: '36px', md: '1.75rem' }}
            minW={{ base: '36px', md: 'auto' }}
            fontSize={{ base: 'xl', md: 'md' }}
            disabled={isLoading}
          >
            <BsX />
          </IconButton>
        </Box>
      )}
      {localValue && localValue.length > 0 && localValue.length < minLength && (
        <Box 
          position="absolute" 
          top="100%" 
          left={0} 
          mt={{ base: 2, md: 1 }} 
          fontSize={{ base: 'sm', md: 'xs' }} 
          color="orange.600"
          bg={{ base: 'orange.50', md: 'transparent' }}
          px={{ base: 2, md: 0 }}
          py={{ base: 1, md: 0 }}
          borderRadius={{ base: 'md', md: 'none' }}
        >
          Type at least {minLength} characters
        </Box>
      )}
      {showHint && localValue.length >= minLength && (
        <Box 
          position="absolute" 
          top="100%" 
          left={0} 
          mt={{ base: 2, md: 1 }} 
          fontSize={{ base: 'sm', md: 'xs' }} 
          color="blue.600" 
          fontWeight="medium"
          bg={{ base: 'blue.50', md: 'transparent' }}
          px={{ base: 2, md: 0 }}
          py={{ base: 1, md: 0 }}
          borderRadius={{ base: 'md', md: 'none' }}
        >
          ⏎ Press Enter to search
        </Box>
      )}
    </Box>
  );
});

SearchInput.displayName = 'SearchInput';

