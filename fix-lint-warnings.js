#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define the fixes to apply
const fixes = [
  {
    file: './src/app/dashboard/admin/academic-years/page.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['Tooltip', 'TooltipContent', 'TooltipTrigger']
      }
    ]
  },
  {
    file: './src/app/dashboard/admin/classes/page.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['Tooltip', 'TooltipContent', 'TooltipTrigger', 'Badge']
      }
    ]
  },
  {
    file: './src/app/dashboard/admin/violations/page.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['Suspense']
      }
    ]
  },
  {
    file: './src/app/dashboard/admin/violations/violations-page-client.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['TabsContent']
      }
    ]
  },
  {
    file: './src/app/dashboard/teacher/grade-reports/page.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['Suspense']
      }
    ]
  },
  {
    file: './src/app/dashboard/teacher/violations/page.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['Suspense']
      }
    ]
  },
  {
    file: './src/features/schedule-change/components/teacher-schedule-change-list.tsx',
    fixes: [
      {
        type: 'remove_unused_variable',
        variable: 'selectedRequest'
      }
    ]
  },
  {
    file: './src/features/timetable/components/timetable-big-calendar.tsx',
    fixes: [
      {
        type: 'remove_unused_imports',
        imports: ['FeedbackInfo']
      }
    ]
  },
  {
    file: './src/lib/actions/parent-grade-actions.ts',
    fixes: [
      {
        type: 'remove_unused_function',
        function: 'processDetailedGradesToAggregated'
      }
    ]
  },
  {
    file: './src/shared/components/dashboard/app-sidebar.tsx',
    fixes: [
      {
        type: 'remove_unused_variable',
        variable: 'handleChatbotOpen'
      }
    ]
  },
  {
    file: './src/shared/components/dashboard/collapse-menu-button.tsx',
    fixes: [
      {
        type: 'remove_unused_variable',
        variable: 'active'
      }
    ]
  },
  {
    file: './src/shared/components/dashboard/user-nav.tsx',
    fixes: [
      {
        type: 'remove_unused_variable',
        variable: 'role'
      }
    ]
  },
  {
    file: './src/shared/hooks/use-breadcrumb.ts',
    fixes: [
      {
        type: 'remove_unused_variable',
        variable: 'role'
      }
    ]
  }
];

function removeUnusedImports(content, imports) {
  let updatedContent = content;
  
  imports.forEach(importName => {
    // Remove from import statements
    const importRegex = new RegExp(`\\s*,?\\s*${importName}\\s*,?`, 'g');
    updatedContent = updatedContent.replace(importRegex, (match) => {
      // If it's the only import or last import, remove comma
      if (match.includes(',')) {
        return match.replace(importName, '').replace(/,\s*,/, ',').replace(/,\s*$/, '');
      }
      return '';
    });
    
    // Clean up empty import braces
    updatedContent = updatedContent.replace(/import\s*{\s*}\s*from/g, '');
    updatedContent = updatedContent.replace(/import\s*{\s*,\s*}/g, 'import { }');
    
    // Remove entire import line if empty
    updatedContent = updatedContent.replace(/^import\s*{\s*}\s*from\s*['"][^'"]*['"];\s*$/gm, '');
  });
  
  return updatedContent;
}

function removeUnusedVariable(content, variable) {
  // Remove variable declarations
  const variableRegex = new RegExp(`\\s*const\\s+${variable}\\s*=.*?;`, 'g');
  return content.replace(variableRegex, '');
}

function removeUnusedFunction(content, functionName) {
  // Remove function declarations (export or not)
  const functionRegex = new RegExp(`export\\s+function\\s+${functionName}\\s*\\([^)]*\\)\\s*{[^}]*}`, 'g');
  return content.replace(functionRegex, '');
}

function applyFixes() {
  console.log('Starting lint warning fixes...\n');
  
  fixes.forEach(({ file, fixes: fileFixes }) => {
    const filePath = path.resolve(file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    console.log(`🔧 Fixing: ${file}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    fileFixes.forEach(fix => {
      const originalContent = content;
      
      switch (fix.type) {
        case 'remove_unused_imports':
          content = removeUnusedImports(content, fix.imports);
          if (content !== originalContent) {
            console.log(`   ✅ Removed unused imports: ${fix.imports.join(', ')}`);
            hasChanges = true;
          }
          break;
          
        case 'remove_unused_variable':
          content = removeUnusedVariable(content, fix.variable);
          if (content !== originalContent) {
            console.log(`   ✅ Removed unused variable: ${fix.variable}`);
            hasChanges = true;
          }
          break;
          
        case 'remove_unused_function':
          content = removeUnusedFunction(content, fix.function);
          if (content !== originalContent) {
            console.log(`   ✅ Removed unused function: ${fix.function}`);
            hasChanges = true;
          }
          break;
      }
    });
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   💾 File updated successfully\n`);
    } else {
      console.log(`   ℹ️  No changes needed\n`);
    }
  });
  
  console.log('✨ All lint warning fixes completed!');
  console.log('\n📝 Note: Image-related warnings (<img> vs <Image>) need manual review as they may affect functionality.');
}

// Run the fixes
applyFixes();
