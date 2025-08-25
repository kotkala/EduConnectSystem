#!/usr/bin/env node

/**
 * Script to standardize loading patterns across admin pages
 * Converts direct useLoading() calls and useState loading to Loading Coordinator
 */

const fs = require('fs');
const path = require('path');

const ADMIN_PAGES_DIR = 'src/app/dashboard/admin';

// Files that need loading pattern updates
const FILES_TO_UPDATE = [
  'src/app/dashboard/admin/classrooms/page.tsx',
  'src/app/dashboard/admin/users/teachers/teachers-page-client.tsx',
  'src/app/dashboard/admin/users/students/students-page-client.tsx',
  'src/app/dashboard/admin/grade-tracking/page.tsx',
  'src/app/dashboard/admin/grade-overwrite-approvals/page.tsx',
  'src/app/dashboard/admin/grade-periods/page.tsx',
  'src/app/dashboard/admin/teacher-assignments/teacher-assignment-client.tsx',
  'src/app/dashboard/admin/notifications/[id]/page.tsx',
  'src/app/dashboard/admin/violations/violations-page-client.tsx'
];

// Loading pattern transformations
const LOADING_PATTERNS = {
  // Replace useState loading with useSectionLoading
  useStateLoading: {
    pattern: /const \[loading, setLoading\] = useState\(true\)/g,
    replacement: 'const { isLoading: loading, startLoading, stopLoading } = useSectionLoading("Đang tải dữ liệu...")'
  },
  
  // Replace setLoading(true) with startLoading()
  startLoading: {
    pattern: /setLoading\(true\)/g,
    replacement: 'startLoading()'
  },
  
  // Replace setLoading(false) with stopLoading()
  stopLoading: {
    pattern: /setLoading\(false\)/g,
    replacement: 'stopLoading()'
  },
  
  // Add useSectionLoading import
  addImport: {
    pattern: /import \{ Skeleton \} from "@\/shared\/components\/ui\/skeleton"/g,
    replacement: `import { Skeleton } from "@/shared/components/ui/skeleton"
import { useSectionLoading } from "@/shared/hooks/use-loading-coordinator"`
  }
};

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check if file already uses Loading Coordinator
    if (content.includes('useSectionLoading') || content.includes('useGlobalLoading')) {
      console.log(`✅ ${filePath} - Already uses Loading Coordinator`);
      return;
    }
    
    // Apply transformations
    Object.entries(LOADING_PATTERNS).forEach(([name, transform]) => {
      if (transform.pattern.test(content)) {
        content = content.replace(transform.pattern, transform.replacement);
        updated = true;
        console.log(`🔄 ${filePath} - Applied ${name} transformation`);
      }
    });
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ ${filePath} - Updated successfully`);
    } else {
      console.log(`⏭️  ${filePath} - No changes needed`);
    }
    
  } catch (error) {
    console.error(`❌ ${filePath} - Error: ${error.message}`);
  }
}

function main() {
  console.log('🚀 Standardizing loading patterns across admin pages...\n');
  
  FILES_TO_UPDATE.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      updateFile(filePath);
    } else {
      console.log(`⚠️  ${filePath} - File not found`);
    }
  });
  
  console.log('\n✅ Loading pattern standardization complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the changes in each file');
  console.log('2. Test loading behavior');
  console.log('3. Update any remaining manual loading states');
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, LOADING_PATTERNS };
