import { Button, ButtonProps } from '@chakra-ui/react';
import { forwardRef, useState, useRef, useCallback } from 'react';

/**
 * ModernButton - A professional interactive button component with Material Design principles
 * 
 * Features:
 * - Material Design-inspired ripple effect on click
 * - Micro-interactions (subtle bounce/scale feedback)
 * - Enhanced focus states for accessibility
 * - Refined gradients with better contrast
 * - Multi-layered shadow system for elevation
 * - Professional spacing and typography
 * 
 * Usage:
 * ```tsx
 * <ModernButton colorPalette="blue" variant="solid">
 *   Click Me
 * </ModernButton>
 * ```
 */
type ColorPalette = 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'gray';
type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'subtle';

export const ModernButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, colorPalette = 'blue', variant = 'solid', onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const rippleIdRef = useRef(0);

    // Extract as string literals for type safety
    const colorPaletteStr = (colorPalette as ColorPalette) || 'blue';
    const variantStr = (variant as ButtonVariant) || 'solid';

    // Professional gradient color mappings with better contrast
    const gradientColors: Record<ColorPalette, { 
      from: string; 
      to: string; 
      glow: string;
      focusColor: string;
    }> = {
      blue: {
        from: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)',
        to: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
        glow: 'rgba(59, 130, 246, 0.4)',
        focusColor: '#3b82f6',
      },
      green: {
        from: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        to: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
        glow: 'rgba(16, 185, 129, 0.4)',
        focusColor: '#10b981',
      },
      red: {
        from: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
        to: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
        glow: 'rgba(239, 68, 68, 0.4)',
        focusColor: '#ef4444',
      },
      orange: {
        from: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
        to: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        glow: 'rgba(249, 115, 22, 0.4)',
        focusColor: '#f97316',
      },
      purple: {
        from: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%)',
        to: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
        glow: 'rgba(139, 92, 246, 0.4)',
        focusColor: '#8b5cf6',
      },
      gray: {
        from: 'linear-gradient(135deg, #6b7280 0%, #4b5563 50%, #374151 100%)',
        to: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
        glow: 'rgba(107, 114, 128, 0.4)',
        focusColor: '#6b7280',
      },
    };

    const colors = gradientColors[colorPaletteStr] || gradientColors.blue;

    // Handle click with ripple effect
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (props.disabled || props.loading) return;

      // Create ripple effect
      const button = buttonRef.current || e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      
      setRipples((prev) => [...prev, { x, y, id }]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
      }, 600);

      // Call original onClick if provided
      onClick?.(e);
    }, [onClick, props.disabled, props.loading]);

    // Combine refs
    const combinedRef = useCallback((node: HTMLButtonElement | null) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      }
      buttonRef.current = node;
    }, [ref]);

    // Professional base styles with mobile optimization
    const baseStyles = {
      position: 'relative' as const,
      overflow: 'hidden',
      borderRadius: 'lg',
      fontWeight: '600',
      fontSize: { base: 'md', md: 'sm' },
      letterSpacing: '0.025em',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: { base: '0.75rem 1rem', md: '0.625rem 1.25rem' },
      minHeight: { base: '44px', md: '2.5rem' },
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: { base: '0.5rem', md: '0.5rem' },
      cursor: 'pointer',
      userSelect: 'none' as const,
      _focusVisible: {
        outline: `3px solid ${colors.focusColor}`,
        outlineOffset: '2px',
      },
    };

    // Variant-specific styles with Material Design elevation
    const variantStyles: Record<ButtonVariant, any> = {
      solid: {
        background: colors.from,
        backgroundSize: '200% 200%',
        border: '1px solid transparent',
        color: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        _hover: {
          background: colors.to,
          backgroundPosition: '100% 0%',
          transform: 'scale(1.02)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
          filter: 'brightness(1.05)',
        },
        _active: {
          transform: 'scale(0.97)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        },
        _disabled: {
          opacity: 0.6,
          cursor: 'not-allowed',
          transform: 'none',
          filter: 'grayscale(0.3)',
        },
      },
      outline: {
        background: 'transparent',
        border: `2px solid ${colors.focusColor}`,
        color: colors.focusColor,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        _hover: {
          background: `${colors.focusColor}15`,
          transform: 'scale(1.02)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        },
        _active: {
          transform: 'scale(0.97)',
          background: `${colors.focusColor}25`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
          transform: 'none',
        },
      },
      ghost: {
        background: 'transparent',
        border: '1px solid transparent',
        color: colors.focusColor,
        _hover: {
          background: `${colors.focusColor}10`,
          transform: 'scale(1.02)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        },
        _active: {
          transform: 'scale(0.97)',
          background: `${colors.focusColor}15`,
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
          transform: 'none',
        },
      },
      subtle: {
        background: `${colors.focusColor}08`,
        border: '1px solid transparent',
        color: colors.focusColor,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        _hover: {
          background: `${colors.focusColor}15`,
          transform: 'scale(1.02)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        },
        _active: {
          transform: 'scale(0.97)',
          background: `${colors.focusColor}20`,
          boxShadow: '0 1px 2px rgba(0,0,0,0.12)',
        },
        _disabled: {
          opacity: 0.5,
          cursor: 'not-allowed',
          transform: 'none',
        },
      },
    };

    const variantStyle = variantStyles[variantStr] || variantStyles.solid;

    return (
      <>
        <style>{`
          @keyframes rippleAnimation {
            0% {
              transform: translate(-50%, -50%) scale(0);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(4);
              opacity: 0;
            }
          }
        `}</style>
        <Button
          ref={combinedRef}
          colorPalette={colorPalette}
          variant={variant}
          onClick={handleClick}
          {...baseStyles}
          {...variantStyle}
          {...props}
        >
          <span style={{ position: 'relative', zIndex: 2 }}>
            {children}
          </span>
          {/* Ripple effects */}
          {ripples.map((ripple) => (
            <span
              key={ripple.id}
              style={{
                position: 'absolute',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.6)',
                transform: `translate(-50%, -50%) scale(0)`,
                left: `${ripple.x}px`,
                top: `${ripple.y}px`,
                width: '100px',
                height: '100px',
                pointerEvents: 'none',
                animation: 'rippleAnimation 0.6s ease-out',
                zIndex: 1,
              }}
            />
          ))}
        </Button>
      </>
    );
  }
);

ModernButton.displayName = 'ModernButton';
