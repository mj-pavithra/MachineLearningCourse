# ModernButton Component Documentation

## Overview

`ModernButton` is a professional, interactive button component built with Material Design principles. It extends Chakra UI's Button with modern styling including Material Design-inspired ripple effects, micro-interactions, enhanced focus states, refined gradients, multi-layered shadows, and smooth animations. This component ensures consistent, professional button design throughout the entire application.

## Usage

```tsx
import { ModernButton } from '@/components/ui/ModernButton';

// Basic usage
<ModernButton colorPalette="blue" variant="solid">
  Click Me
</ModernButton>

// With icon
<ModernButton colorPalette="green" variant="solid">
  <HiPlus />
  Add Item
</ModernButton>

// Loading state
<ModernButton colorPalette="blue" loading={isLoading}>
  Submit
</ModernButton>

// Disabled state
<ModernButton colorPalette="red" disabled>
  Delete
</ModernButton>
```

## Props

All Chakra UI Button props are supported. Key props:

- `colorPalette`: Color scheme (`'blue'`, `'green'`, `'red'`, `'orange'`, `'purple'`, `'gray'`)
- `variant`: Button style (`'solid'`, `'outline'`, `'ghost'`, `'subtle'`)
- `size`: Button size (`'xs'`, `'sm'`, `'md'`, `'lg'`)
- `loading`: Shows loading spinner
- `disabled`: Disables the button
- All other standard Button props (onClick, children, etc.)

## Material Design Features

### Ripple Effect
- **Material Design-inspired ripple animation** on click
- Ripple originates from the exact click position
- White semi-transparent circle that expands smoothly
- 600ms fade-out animation with ease-out timing
- Multiple ripples can exist simultaneously for rapid clicks
- Automatically cleaned up after animation completes

### Micro-interactions
- **Hover**: Subtle scale (1.02) with elevation increase
- **Active**: Scale down (0.97) with enhanced shadow feedback
- **Focus**: Visible outline ring (2px) with color-matched border for accessibility
- **Loading**: Maintains styling with animated spinner
- Smooth transitions using cubic-bezier easing

### Enhanced States

#### Hover State
- Elevation increase (multi-layered shadows)
- Brightness boost (5% increase)
- Scale transform (1.02)
- Smooth 0.2s transition

#### Active State
- Pressed state with scale down (0.97)
- Shadow reduction for tactile feedback
- Immediate visual response

#### Focus State
- Accessible focus ring (2px outline, 2px offset)
- Color-matched to button palette
- High contrast for accessibility compliance
- Visible on keyboard navigation

#### Disabled State
- Reduced opacity (0.6 for solid, 0.5 for others)
- Grayscale filter (30% for solid variant)
- No interactions or animations
- Clear visual indication

#### Loading State
- Maintains all styling properties
- Animated spinner overlay
- Smooth transitions

## Design Features

### Gradients (Refined)
Each color palette has professional, subtle gradients with better contrast ratios:
- **Blue**: Professional blue gradient (#3b82f6 → #2563eb → #1d4ed8)
- **Green**: Modern green gradient (#10b981 → #059669 → #047857)
- **Red**: Vibrant red gradient (#ef4444 → #dc2626 → #b91c1c)
- **Orange**: Warm orange gradient (#f97316 → #ea580c → #c2410c)
- **Purple**: Rich purple gradient (#8b5cf6 → #7c3aed → #6d28d9)
- **Gray**: Neutral gray gradient (#6b7280 → #4b5563 → #374151)

### Shadows & Elevation System
Material Design-inspired multi-layered shadow system:
- **Base**: `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)`
- **Hover**: `0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)`
- **Active**: `0 1px 2px rgba(0,0,0,0.12)`

### Typography
- Font weight: 600 (semibold)
- Letter spacing: 0.025em
- Improved line height for readability
- Professional spacing and padding

### Spacing
- Padding: `0.625rem 1.25rem` (10px 20px)
- Minimum height: `2.5rem` (40px)
- Gap between icon and text: `0.5rem` (8px)

## Variants

### Solid
Full gradient background with Material Design elevation. Best for primary actions.
- Multi-layered shadows
- Gradient background transitions
- Ripple effect on click

### Outline
Transparent background with colored border. Good for secondary actions.
- 2px solid border
- Subtle background on hover
- Clear focus states

### Ghost
Minimal styling with hover effects. Ideal for tertiary actions.
- Transparent by default
- Background appears on hover
- Subtle elevation on interaction

### Subtle
Light background with subtle effects. Perfect for less prominent actions.
- Light background tint (8% opacity)
- Enhanced on hover (15% opacity)
- Professional appearance

## Interactive Features

### Ripple Animation
The ripple effect provides tactile feedback:
- Click anywhere on the button to see the ripple
- Ripple expands from click position
- Smooth fade-out animation
- Multiple clicks create multiple ripples

### Micro-interactions
Every interaction provides visual feedback:
- **Hover**: Button lifts slightly with increased shadow
- **Click**: Button presses down with scale animation
- **Focus**: Clear outline appears for keyboard users
- **Release**: Button returns to normal state smoothly

## Examples

### Primary Action
```tsx
<ModernButton colorPalette="blue" variant="solid">
  Save Changes
</ModernButton>
```

### Secondary Action
```tsx
<ModernButton colorPalette="gray" variant="outline">
  Cancel
</ModernButton>
```

### Danger Action
```tsx
<ModernButton colorPalette="red" variant="solid">
  Delete
</ModernButton>
```

### Success Action
```tsx
<ModernButton colorPalette="green" variant="solid">
  Confirm
</ModernButton>
```

### With Loading State
```tsx
<ModernButton 
  colorPalette="blue" 
  loading={isSubmitting}
  disabled={isSubmitting}
>
  Submit
</ModernButton>
```

### With Icon
```tsx
<ModernButton colorPalette="purple" variant="solid">
  <HiPlus />
  Add New Item
</ModernButton>
```

## Technical Details

### Ripple Implementation
- Uses React state to track ripple positions
- Calculates click position relative to button element
- Renders ripples as absolutely positioned elements
- Auto-cleanup after 600ms animation completes
- CSS keyframe animation for smooth expansion

### Micro-interactions
- CSS transitions for hover/active states (0.2s duration)
- Scale transforms for tactile feedback
- Shadow transitions for elevation changes
- Smooth easing functions (cubic-bezier(0.4, 0, 0.2, 1))

### Focus States
- Visible outline ring (2px width)
- Color-matched to button palette
- 2px offset for clear visibility
- High contrast for accessibility compliance

### Animation Specifications
- **Ripple**: 600ms duration, ease-out timing
- **Hover**: 0.2s duration, cubic-bezier(0.4, 0, 0.2, 1)
- **Active**: 0.2s duration, cubic-bezier(0.4, 0, 0.2, 1)
- **Scale**: Hover 1.02, Active 0.97

## Accessibility

### Keyboard Navigation
- Full keyboard support (Enter, Space)
- Clear focus indicators
- High contrast focus rings
- Proper ARIA attributes (inherited from Chakra UI)

### Screen Readers
- Proper button semantics
- Loading state announcements
- Disabled state indicators
- All Chakra UI accessibility features preserved

## Future Implementation Rule

**IMPORTANT**: All new buttons in the project MUST use `ModernButton` instead of Chakra UI's `Button` directly. This ensures consistent professional styling with Material Design principles across the entire application.

### Correct Usage
```tsx
import { ModernButton } from '@/components/ui/ModernButton';

<ModernButton colorPalette="blue">Click Me</ModernButton>
```

### Incorrect Usage
```tsx
import { Button } from '@chakra-ui/react'; // ❌ Don't do this

<Button colorPalette="blue">Click Me</Button> // ❌ Don't do this
```

## Migration Notes

If you encounter any Chakra UI `Button` components in the codebase, they should be replaced with `ModernButton`:

1. Remove `Button` from `@chakra-ui/react` imports
2. Add `import { ModernButton } from '@/components/ui/ModernButton';`
3. Replace `<Button>` with `<ModernButton>`
4. Replace `</Button>` with `</ModernButton>`

All existing props will work without modification. The new Material Design features (ripple effects, micro-interactions) will be automatically available.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS animations and transforms supported
- Backdrop filter gracefully degrades
- Focus states work with keyboard navigation
