import { useState } from 'react';
import { Input, IconButton, Box } from '@chakra-ui/react';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { forwardRef } from 'react';

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  error?: string;
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  borderRadius?: string;
  borderWidth?: string;
  pl?: string;
  minH?: string | { base?: string; md?: string };
  fontSize?: string | { base?: string; md?: string };
  _focus?: Record<string, any>;
  _invalid?: Record<string, any>;
  transition?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      error,
      invalid,
      size = 'lg',
      borderRadius = 'lg',
      borderWidth = '2px',
      pl = '10',
      minH,
      fontSize,
      _focus,
      _invalid,
      transition,
      placeholder = 'Enter your password',
      autoComplete = 'current-password',
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    // Extract h from props if present and use it for minH if minH is not provided
    const { h, ...restProps } = props as any;
    const effectiveMinH = minH || h;

    return (
      <Box position="relative" w="full">
        <Input
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          autoComplete={autoComplete}
          pr="12"
          size={size}
          borderRadius={borderRadius}
          borderWidth={borderWidth}
          pl={pl}
          minH={effectiveMinH}
          fontSize={fontSize}
          width="full"
          _focus={_focus}
          _invalid={_invalid || (invalid ? { borderColor: 'red.500' } : undefined)}
          transition={transition}
          {...restProps}
        />
        <Box
          position="absolute"
          right="2"
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
        >
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword(!showPassword)}
            type="button"
            color="gray.500"
            _hover={{ color: 'gray.700' }}
          >
            {showPassword ? <HiEyeOff size={18} /> : <HiEye size={18} />}
          </IconButton>
        </Box>
      </Box>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

