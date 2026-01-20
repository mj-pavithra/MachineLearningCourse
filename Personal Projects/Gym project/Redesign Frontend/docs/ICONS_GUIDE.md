# Icons Usage Guide

## Overview

This project uses a **centralized icon utility** (`src/utils/icons.ts`) to prevent icon import errors and ensure consistency across the application.

## Why Use the Icons Utility?

1. **Prevents Runtime Errors**: Icons are validated and have fallbacks
2. **Type Safety**: TypeScript ensures only valid icon names are used
3. **Consistency**: Single source of truth for icon usage
4. **Maintainability**: Easy to update icon sets in one place
5. **Reliability**: Automatic fallback to alternative icons if primary fails

## Usage

### Method 1: Using the Icons Object (Recommended)

```tsx
import { Icons } from '@/utils/icons';

// In your component
<Icons.Package size={20} />
<Icons.CurrencyDollar color="green" />
<Icons.UserAdd />
```

### Method 2: Using the renderIcon Function

```tsx
import { renderIcon } from '@/utils/icons';

// In your component
{renderIcon('package', { size: 20, color: 'blue' })}
```

### Method 3: Using the getIcon Function

```tsx
import { getIcon } from '@/utils/icons';

const PackageIcon = getIcon('package', { size: 20 });
<PackageIcon />
```

## Available Icons

All available icons are exported from the `Icons` object:

- `Icons.Package` - Package/box icon (HiCube)
- `Icons.Box` - Box icon (FiBox)
- `Icons.CurrencyDollar` - Currency/money icon
- `Icons.CheckCircle` - Check circle icon
- `Icons.UserAdd` - Add user icon
- `Icons.Calendar` - Calendar icon
- `Icons.Login` - Login icon
- `Icons.Download` - Download icon
- `Icons.Users` - Users icon
- `Icons.UserGroup` - User group icon
- `Icons.Clock` - Clock icon
- `Icons.Pencil` - Pencil/edit icon
- `Icons.Trash` - Trash/delete icon
- `Icons.DotsVertical` - Vertical dots menu icon
- `Icons.Plus` - Plus/add icon
- `Icons.X` - X/close icon
- `Icons.Eye` - Eye/view icon
- `Icons.Refresh` - Refresh icon
- `Icons.ArrowUp` - Arrow up icon
- `Icons.ArrowDown` - Arrow down icon
- `Icons.InformationCircle` - Information icon
- `Icons.Inbox` - Inbox icon
- `Icons.Mail` - Mail icon
- `Icons.LockClosed` - Lock icon
- `Icons.Menu` - Menu icon
- `Icons.Upload` - Upload icon
- `Icons.Edit` - Edit icon
- `Icons.UserPlus` - User plus icon
- `Icons.FileCsv` - CSV file icon
- `Icons.FilePdf` - PDF file icon

## Adding New Icons

To add a new icon:

1. Import the icon from `react-icons` in `src/utils/icons.ts`
2. Add it to the `ICON_MAP` with a primary and fallback
3. Export it from the `Icons` object
4. Add the icon name to the `IconName` type

Example:

```typescript
// In src/utils/icons.ts
import { HiNewIcon } from 'react-icons/hi';
import { FiNewIconFallback } from 'react-icons/fi';

// Add to ICON_MAP
const ICON_MAP: Record<IconName, ...> = {
  // ... existing icons
  'new-icon': { primary: HiNewIcon, fallback: FiNewIconFallback },
};

// Add to Icons export
export const Icons = {
  // ... existing icons
  NewIcon: HiNewIcon,
} as const;

// Add to IconName type
export type IconName =
  | 'package'
  | 'box'
  // ... existing names
  | 'new-icon';
```

## Direct Imports (Not Recommended)

While you can still import icons directly from `react-icons`, it's **not recommended** because:

- ❌ No validation - missing icons cause runtime errors
- ❌ No fallbacks - app breaks if icon is removed
- ❌ Inconsistent usage across the codebase
- ❌ Harder to maintain

If you must use direct imports, validate them first:

```tsx
// ❌ Not recommended
import { HiPackage } from 'react-icons/hi'; // This doesn't exist!

// ✅ Recommended
import { Icons } from '@/utils/icons';
<Icons.Package />
```

## Validation

Run the icon validation script to check for invalid icon imports:

```bash
npm run validate:icons
```

This will:
- Scan all TypeScript files for icon imports
- Check if icons exist in their respective packages
- Report errors and warnings
- Suggest using the Icons utility

## Common Issues

### Issue: "Icon does not provide an export named 'X'"

**Solution**: Use the Icons utility instead:

```tsx
// ❌ Before
import { HiPackage } from 'react-icons/hi'; // Doesn't exist

// ✅ After
import { Icons } from '@/utils/icons';
<Icons.Package />
```

### Issue: Icon looks different than expected

**Solution**: Check the icon mapping in `src/utils/icons.ts` and update if needed.

## Migration Guide

To migrate existing direct imports to the Icons utility:

1. Find direct imports:
   ```tsx
   import { HiPackage } from 'react-icons/hi';
   ```

2. Replace with Icons utility:
   ```tsx
   import { Icons } from '@/utils/icons';
   ```

3. Update usage:
   ```tsx
   // Before
   <HiPackage size={20} />
   
   // After
   <Icons.Package size={20} />
   ```

## Best Practices

1. ✅ **Always use the Icons utility** for new code
2. ✅ **Run validation** before committing: `npm run validate:icons`
3. ✅ **Use descriptive icon names** that match their purpose
4. ✅ **Provide fallbacks** when adding new icons
5. ✅ **Document icon usage** in component comments
6. ❌ **Don't import icons directly** from react-icons
7. ❌ **Don't use icons that aren't in the utility**

## Icon Sets Used

- **Heroicons (hi)**: Primary icon set - most stable and comprehensive
- **Feather Icons (fi)**: Fallback icon set - reliable alternative
- **Font Awesome (fa)**: File type icons (CSV, PDF)

## Support

If you encounter icon-related issues:

1. Check if the icon exists in `src/utils/icons.ts`
2. Run `npm run validate:icons` to check for issues
3. Check the [react-icons documentation](https://react-icons.github.io/react-icons/)
4. Add the icon to the utility if it's missing



