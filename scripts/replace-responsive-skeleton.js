const fs = require('fs');
const path = require('path');

console.log('🔧 Thay thế ResponsiveSkeleton bằng Skeleton chuẩn Shadcn UI...\n');

// Mapping từ ResponsiveSkeleton type sang Skeleton className
const skeletonMapping = {
  'card': 'h-32 w-full rounded-lg',
  'text': 'h-3 w-full rounded',
  'title': 'h-4 w-1/2 rounded',
  'avatar': 'h-8 w-8 rounded-full',
  'button': 'h-8 w-16 rounded-md',
  'input': 'h-8 w-full rounded-md',
  'table': 'h-8 w-full rounded',
  'list': 'h-12 w-full rounded',
  'grid': 'h-24 w-full rounded-lg',
  'sidebar': 'h-6 w-full rounded',
  'form': 'h-16 w-full rounded-lg',
  'chart': 'h-48 w-full rounded-lg',
  'modal': 'h-64 w-full rounded-lg',
  'navigation': 'h-8 w-full rounded',
  'footer': 'h-16 w-full rounded',
  'header': 'h-12 w-full rounded',
  'default': 'h-8 w-full rounded-md'
};

function replaceInFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File không tồn tại: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Thay thế import
  if (content.includes('ResponsiveSkeleton')) {
    // Thay thế import
    content = content.replace(
      /import\s*{\s*ResponsiveSkeleton\s*}\s*from\s*["']@\/shared\/components\/ui\/skeleton-utils["']/g,
      'import { Skeleton } from "@/shared/components/ui/skeleton"'
    );

    // Thay thế ResponsiveSkeleton usage
    content = content.replace(
      /<ResponsiveSkeleton\s+type=["']([^"']+)["']\s*\/?>/g,
      (match, type) => {
        const className = skeletonMapping[type] || skeletonMapping.default;
        return `<Skeleton className="${className}" />`;
      }
    );

    // Thay thế ResponsiveSkeleton không có type
    content = content.replace(
      /<ResponsiveSkeleton\s*\/?>/g,
      '<Skeleton className="h-8 w-full rounded-md" />'
    );

    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Đã cập nhật: ${filePath}`);
  } else {
    console.log(`⏭️  Không cần cập nhật: ${filePath}`);
  }
}

// Danh sách các file cần cập nhật (từ grep search)
const filesToUpdate = [
  'src/features/admin-management/components/admin/grade-period-form.tsx',
  'src/app/dashboard/admin/grade-overwrite-approvals/page.tsx',
  'src/app/dashboard/admin/grade-improvement/admin-grade-improvement-client.tsx',
  'src/app/dashboard/parent/reports/parent-reports-client.tsx',
  'src/app/dashboard/admin/teacher-assignments/teacher-assignment-client.tsx',
  'src/app/dashboard/admin/grade-tracking/student/[studentId]/page.tsx',
  'src/app/dashboard/admin/grade-tracking/page.tsx',
  'src/app/dashboard/parent/notifications/[id]/page.tsx',
  'src/app/dashboard/admin/grade-periods/page.tsx',
  'src/app/dashboard/admin/notifications/[id]/page.tsx',
  'src/app/dashboard/parent/leave-status/page.tsx',
  'src/app/dashboard/parent/leave-application/page.tsx',
  'src/app/dashboard/parent/grades/[submissionId]/parent-grade-detail-client.tsx',
  'src/app/dashboard/parent/leave-application/create/page.tsx'
];

// Cập nhật từng file
filesToUpdate.forEach(replaceInFile);

console.log('\n🎉 Hoàn tất thay thế ResponsiveSkeleton bằng Skeleton chuẩn!');
console.log('\n📝 Lưu ý: Có thể cần điều chỉnh thủ công một số className để phù hợp với design.');
