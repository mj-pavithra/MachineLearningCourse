import { Box } from '@chakra-ui/react';
import { ReactNode } from 'react';

/**
 * Custom Circular Progress component for Chakra UI v3
 * 
 * Chakra UI v3 removed the CircularProgress component, so this is a custom
 * SVG-based implementation that provides the same functionality.
 * 
 * @example
 * ```tsx
 * <CircularProgress value={75} size="120px" thickness="8px" color="green">
 *   <VStack gap={0}>
 *     <Text fontSize="2xl" fontWeight="bold">75%</Text>
 *     <Text fontSize="xs">Complete</Text>
 *   </VStack>
 * </CircularProgress>
 * ```
 */
export interface CircularProgressProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Size of the circular progress (e.g., "120px", "100px")
   * @default "120px"
   */
  size?: string;
  /**
   * Thickness of the progress ring (e.g., "8px", "4px")
   * @default "8px"
   */
  thickness?: string;
  /**
   * Color of the progress ring (green, yellow, red, or any Chakra color)
   * @default "blue"
   */
  color?: 'green' | 'yellow' | 'red' | 'blue' | string;
  /**
   * Content to display in the center of the circle
   */
  children?: ReactNode;
  /**
   * Additional props for the container Box
   */
  [key: string]: any;
}

/**
 * Get Chakra UI color value from color name
 * Uses Chakra UI v3 CSS variable tokens
 */
function getColorValue(color: string): string {
  // Map common color names to Chakra UI v3 color tokens
  const colorMap: Record<string, string> = {
    green: 'var(--chakra-colors-green-500)',
    yellow: 'var(--chakra-colors-yellow-500)',
    red: 'var(--chakra-colors-red-500)',
    blue: 'var(--chakra-colors-blue-500)',
    gray: 'var(--chakra-colors-gray-500)',
    orange: 'var(--chakra-colors-orange-500)',
    purple: 'var(--chakra-colors-purple-500)',
    pink: 'var(--chakra-colors-pink-500)',
  };
  
  // Return mapped color or try to construct token from color name
  if (colorMap[color]) {
    return colorMap[color];
  }
  
  // Fallback: try to use color as-is if it's already a valid CSS value
  // Otherwise, default to blue
  if (color.startsWith('var(') || color.startsWith('#') || color.startsWith('rgb')) {
    return color;
  }
  
  // Try to construct Chakra UI token
  return `var(--chakra-colors-${color}-500, var(--chakra-colors-blue-500))`;
}

export function CircularProgress({
  value,
  size = '120px',
  thickness = '8px',
  color = 'blue',
  children,
  ...boxProps
}: CircularProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));
  
  // Parse size to get numeric value
  const sizeNum = parseInt(size, 10);
  const thicknessNum = parseInt(thickness, 10);
  
  // Calculate SVG dimensions
  const svgSize = sizeNum;
  const center = svgSize / 2;
  const radius = (svgSize - thicknessNum) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash offset for progress
  const offset = circumference - (clampedValue / 100) * circumference;
  
  // Get color value
  const colorValue = getColorValue(color);
  
  return (
    <Box position="relative" width={size} height={size} {...boxProps}>
      <svg
        width={svgSize}
        height={svgSize}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--chakra-colors-gray-200)"
          strokeWidth={thicknessNum}
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colorValue}
          strokeWidth={thicknessNum}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>
      {/* Center content */}
      {children && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {children}
        </Box>
      )}
    </Box>
  );
}

/**
 * CircularProgressLabel component for consistency with Chakra UI v2 API
 * This is just a pass-through component that renders its children
 */
export function CircularProgressLabel({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

