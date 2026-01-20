/**
 * Icon validation script
 * 
 * This script validates that all icons imported from react-icons exist.
 * Run this as part of CI/CD or before builds to catch icon import errors early.
 * 
 * Usage:
 *   node scripts/validate-icons.js
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Known valid icon sets and their exports
const VALID_ICON_SETS = {
  'react-icons/hi': [
    'HiCube', 'HiCollection', 'HiCubeTransparent', 'HiCurrencyDollar',
    'HiCheckCircle', 'HiUserAdd', 'HiCalendar', 'HiLogin', 'HiDownload',
    'HiUsers', 'HiUserGroup', 'HiClock', 'HiPencil', 'HiTrash',
    'HiDotsVertical', 'HiPlus', 'HiX', 'HiEye', 'HiRefresh',
    'HiArrowUp', 'HiArrowDown', 'HiInformationCircle', 'HiInbox',
    'HiMail', 'HiLockClosed', 'HiMenu', 'HiEyeOff'
  ],
  'react-icons/fi': [
    'FiBox', 'FiPackage', 'FiPlus', 'FiUpload', 'FiDownload',
    'FiMoreVertical', 'FiTrash2', 'FiEdit', 'FiUserPlus'
  ],
  'react-icons/fa': [
    'FaFileCsv', 'FaFilePdf'
  ]
};

// Icons that DON'T exist (known issues)
const INVALID_ICONS = {
  'react-icons/hi': ['HiPackage'] // This doesn't exist - use HiCube instead
};

/**
 * Extract icon imports from a file
 */
function extractIconImports(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const imports = [];
  
  // Match: import { Icon1, Icon2 } from 'react-icons/xxx'
  const importRegex = /import\s+{([^}]+)}\s+from\s+['"](react-icons\/[^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const iconNames = match[1]
      .split(',')
      .map(name => name.trim())
      .filter(name => name);
    const source = match[2];
    
    iconNames.forEach(iconName => {
      imports.push({ iconName, source, filePath });
    });
  }
  
  return imports;
}

/**
 * Validate icon imports
 */
function validateIcons() {
  const srcDir = join(__dirname, '..', 'src');
  const errors = [];
  const warnings = [];
  
  // Recursively find all .ts and .tsx files
  function findFiles(dir) {
    const files = [];
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory() && !entry.includes('node_modules')) {
        files.push(...findFiles(fullPath));
      } else if (stat.isFile() && (extname(entry) === '.ts' || extname(entry) === '.tsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const files = findFiles(srcDir);
  console.log(`\n🔍 Scanning ${files.length} files for icon imports...\n`);
  
  for (const file of files) {
    const imports = extractIconImports(file);
    
    for (const { iconName, source, filePath } of imports) {
      // Check if icon is in invalid list
      if (INVALID_ICONS[source]?.includes(iconName)) {
        errors.push({
          type: 'INVALID_ICON',
          icon: iconName,
          source,
          file: filePath,
          message: `Icon "${iconName}" does not exist in "${source}". Use Icons utility instead.`
        });
        continue;
      }
      
      // Check if icon set is known
      if (!VALID_ICON_SETS[source]) {
        warnings.push({
          type: 'UNKNOWN_ICON_SET',
          source,
          file: filePath,
          message: `Unknown icon set "${source}". Consider using centralized Icons utility.`
        });
        continue;
      }
      
      // Check if icon exists in valid list
      if (!VALID_ICON_SETS[source].includes(iconName)) {
        warnings.push({
          type: 'POTENTIALLY_INVALID_ICON',
          icon: iconName,
          source,
          file: filePath,
          message: `Icon "${iconName}" may not exist in "${source}". Verify or use Icons utility.`
        });
      }
    }
  }
  
  // Report results
  if (errors.length > 0) {
    console.error('❌ ERRORS FOUND:\n');
    errors.forEach(({ icon, source, file, message }) => {
      console.error(`  ${icon} from ${source}`);
      console.error(`    File: ${file}`);
      console.error(`    ${message}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️  WARNINGS:\n');
    warnings.forEach(({ icon, source, file, message }) => {
      console.warn(`  ${icon || source}`);
      console.warn(`    File: ${file}`);
      console.warn(`    ${message}\n`);
    });
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All icon imports validated successfully!\n');
    return 0;
  }
  
  if (errors.length > 0) {
    console.error(`\n❌ Found ${errors.length} error(s) and ${warnings.length} warning(s)\n`);
    return 1;
  }
  
  console.warn(`\n⚠️  Found ${warnings.length} warning(s)\n`);
  return 0;
}

// Run validation
const exitCode = validateIcons();
process.exit(exitCode);



