const fs = require('fs');

// Test file cụ thể
const testFile = 'src/features/admin-management/components/admin/violations/violation-categories-manager.tsx';

console.log('Đang test file:', testFile);

if (fs.existsSync(testFile)) {
  const content = fs.readFileSync(testFile, 'utf8');
  
  // Tìm các ký tự có vẻ bị encode
  const lines = content.split('\n');
  
  console.log('\nCác dòng chứa ký tự có thể bị encode:');
  lines.forEach((line, index) => {
    // Tìm các pattern có thể bị encode
    if (line.match(/[ÃÄáºáº»á»]/)) {
      console.log(`Dòng ${index + 1}: ${line.trim()}`);
    }
  });
  
  // Test một vài thay thế cụ thể
  console.log('\nTest thay thế:');
  console.log('Original: "Há»c thuáº­t"');
  console.log('After replace: "' + 'Há»c thuáº­t'.replace('Há»c', 'Học').replace('thuáº­t', 'thuật') + '"');
  
} else {
  console.log('File không tồn tại');
}
