const fs = require('fs');
const path = require('path');

console.log('🔧 Sửa các lỗi coordinatedLoading, startPageTransition, stopLoading...\n');

// Danh sách các file cần sửa
const filesToFix = [
  'src/app/student/grade-improvement/student-grade-improvement-client.tsx',
  'src/app/dashboard/teacher/teacher-weekly-dashboard.tsx',
  'src/app/dashboard/parent/page.tsx',
  'src/app/dashboard/admin/grade-improvement/admin-grade-improvement-client.tsx',
  'src/app/dashboard/teacher/reports/teacher-reports-client.tsx',
  'src/app/dashboard/teacher/grade-reports/teacher-grade-reports-client.tsx',
  'src/app/dashboard/admin/analytics/analytics-client.tsx',
  'src/app/dashboard/teacher/leave-requests/page.tsx'
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File không tồn tại: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Thêm import useLoading nếu chưa có
  if (!content.includes('useLoading') && !content.includes('coordinatedLoading')) {
    return; // File không cần sửa
  }

  // Thêm import useLoading
  if (!content.includes("import { useLoading } from '@/shared/components/ui/loading-provider'")) {
    const importMatch = content.match(/import.*from.*['"]@\/shared\/components\/ui\/skeleton-utils['"]/);
    if (importMatch) {
      content = content.replace(
        importMatch[0],
        `${importMatch[0]}\nimport { useLoading } from '@/shared/components/ui/loading-provider'`
      );
      modified = true;
    }
  }

  // Thêm useLoading hook
  if (!content.includes('const { startLoading, stopLoading } = useLoading()')) {
    const functionMatch = content.match(/export default function \w+\(/);
    if (functionMatch) {
      const afterFunction = content.indexOf('{', content.indexOf(functionMatch[0]));
      if (afterFunction !== -1) {
        const nextBrace = content.indexOf('{', afterFunction + 1);
        if (nextBrace !== -1) {
          const insertPos = nextBrace + 1;
          const beforeInsert = content.substring(0, insertPos);
          const afterInsert = content.substring(insertPos);
          
          // Tìm vị trí để thêm loading states
          const stateMatch = afterInsert.match(/\s*const \[.*\] = useState/);
          if (stateMatch) {
            const statePos = afterInsert.indexOf(stateMatch[0]);
            const newContent = beforeInsert + 
              '\n  // Loading States\n' +
              '  const [isLoading, setIsLoading] = useState(false)\n' +
              '  const { startLoading, stopLoading } = useLoading()\n' +
              afterInsert.substring(0, statePos) +
              afterInsert.substring(statePos);
            content = newContent;
            modified = true;
          }
        }
      }
    }
  }

  // Sửa coordinatedLoading.isLoading
  content = content.replace(/coordinatedLoading\.isLoading/g, 'isLoading');
  modified = true;

  // Sửa startPageTransition
  content = content.replace(/startPageTransition\s*\(\s*["`]([^"`]*)["`]\s*\)/g, 'startLoading("$1")');
  modified = true;

  // Sửa stopLoading()
  content = content.replace(/stopLoading\s*\(\s*\)/g, 'stopLoading()');
  modified = true;

  // Thêm setIsLoading vào các hàm fetch
  content = content.replace(
    /startLoading\s*\(\s*["`]([^"`]*)["`]\s*\)/g,
    'startLoading("$1")\n    setIsLoading(true)'
  );
  
  content = content.replace(
    /stopLoading\s*\(\s*\)/g,
    'setIsLoading(false)\n    stopLoading()'
  );

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Đã sửa: ${filePath}`);
  } else {
    console.log(`⏭️  Không cần sửa: ${filePath}`);
  }
}

// Sửa từng file
filesToFix.forEach(fixFile);

console.log('\n🎉 Hoàn tất sửa các lỗi coordinatedLoading!');
