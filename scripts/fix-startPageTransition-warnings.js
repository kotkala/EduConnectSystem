#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need to be fixed
const filesToFix = [
  'src/app/dashboard/admin/analytics/analytics-client.tsx',
  'src/app/dashboard/admin/classes/page.tsx',
  'src/app/dashboard/admin/grade-improvement/admin-grade-improvement-client.tsx',
  'src/app/dashboard/admin/report-periods/page.tsx',
  'src/app/dashboard/parent/page.tsx',
  'src/app/dashboard/parent/reports/parent-reports-client.tsx',
  'src/app/dashboard/teacher/grade-reports/teacher-grade-reports-client.tsx',
  'src/app/dashboard/teacher/leave-requests/page.tsx',
  'src/app/dashboard/teacher/reports/teacher-reports-client.tsx',
  'src/app/dashboard/teacher/teacher-weekly-dashboard.tsx',
  'src/app/student/grade-improvement/student-grade-improvement-client.tsx'
];

console.log('🔧 Sửa các warning startPageTransition và stopLoading...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ Không tìm thấy file: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Fix pattern: }, [..., startPageTransition, stopLoading])
  const pattern1 = /}, \[([^\]]*), startPageTransition, stopLoading\]\)/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, (match, deps) => {
      modified = true;
      return `}, [${deps}])`;
    });
  }

  // Fix pattern: }, [startPageTransition, stopLoading, ...])
  const pattern2 = /}, \[startPageTransition, stopLoading, ([^\]]*)\]\)/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, (match, deps) => {
      modified = true;
      return `}, [${deps}])`;
    });
  }

  // Fix pattern: }, [startPageTransition, stopLoading])
  const pattern3 = /}, \[startPageTransition, stopLoading\]\)/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, () => {
      modified = true;
      return `}, [])`;
    });
  }

  // Fix pattern: }, [..., startPageTransition, ...])
  const pattern4 = /}, \[([^,]*), startPageTransition, ([^\]]*)\]\)/g;
  if (pattern4.test(content)) {
    content = content.replace(pattern4, (match, deps1, deps2) => {
      modified = true;
      return `}, [${deps1}, ${deps2}])`;
    });
  }

  // Fix pattern: }, [..., stopLoading, ...])
  const pattern5 = /}, \[([^,]*), stopLoading, ([^\]]*)\]\)/g;
  if (pattern5.test(content)) {
    content = content.replace(pattern5, (match, deps1, deps2) => {
      modified = true;
      return `}, [${deps1}, ${deps2}])`;
    });
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Đã sửa: ${filePath}`);
  } else {
    console.log(`⏭️  Không cần sửa: ${filePath}`);
  }
});

console.log('\n🎉 Hoàn tất sửa các warning startPageTransition và stopLoading!');
