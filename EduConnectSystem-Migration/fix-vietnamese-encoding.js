const fs = require('fs');
const path = require('path');

// Load mapping từ file JSON
console.log('Loading mapping...');
const VIETNAMESE_ENCODING_MAP = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'vietnamese-map.json'), 'utf8')
);
console.log('Mapping loaded:', Object.keys(VIETNAMESE_ENCODING_MAP).length, 'entries');

// Hàm để tìm tất cả các file TypeScript/JavaScript
function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Bỏ qua các thư mục không cần thiết
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Hàm để khôi phục encoding trong một file
function fixEncodingInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let changeCount = 0;
    
    // Thay thế từng pattern trong mapping
    for (const [encoded, correct] of Object.entries(VIETNAMESE_ENCODING_MAP)) {
      const regex = new RegExp(encoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        content = content.replace(regex, correct);
        changeCount += matches.length;

        // Debug: log first match found
        if (changeCount === matches.length) {
          console.log(`Found "${encoded}" -> "${correct}" in ${filePath}`);
        }
      }
    }
    
    // Nếu có thay đổi, ghi lại file
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return changeCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`Lỗi khi xử lý file ${filePath}:`, error.message);
    return 0;
  }
}

// Hàm chính
function main() {
  console.log('🔍 Bắt đầu tìm kiếm và khôi phục ký tự tiếng Việt bị encode...\n');

  const srcDir = path.join(__dirname, 'src');
  console.log('Đang tìm thư mục:', srcDir);

  if (!fs.existsSync(srcDir)) {
    console.error('❌ Không tìm thấy thư mục src/');
    console.log('Thư mục hiện tại:', __dirname);
    console.log('Các file/thư mục có sẵn:');
    fs.readdirSync(__dirname).forEach(item => {
      console.log('  -', item);
    });
    return;
  }
  
  const files = findFiles(srcDir);
  console.log(`📁 Tìm thấy ${files.length} file để kiểm tra\n`);
  
  let totalChanges = 0;
  let fixedFiles = 0;
  
  files.forEach((filePath, index) => {
    const changes = fixEncodingInFile(filePath);
    if (changes > 0) {
      const relativePath = path.relative(__dirname, filePath);
      console.log(`✅ ${relativePath}: ${changes} thay đổi`);
      totalChanges += changes;
      fixedFiles++;
    }

    // Debug: show progress for first few files
    if (index < 3) {
      const relativePath = path.relative(__dirname, filePath);
      console.log(`Debug: Checked ${relativePath} - ${changes} changes`);
    }
  });
  
  console.log('\n📊 Kết quả:');
  console.log(`   - Tổng số file đã sửa: ${fixedFiles}`);
  console.log(`   - Tổng số thay đổi: ${totalChanges}`);
  
  if (fixedFiles > 0) {
    console.log('\n🎉 Hoàn thành! Các ký tự tiếng Việt đã được khôi phục.');
  } else {
    console.log('\n✨ Không tìm thấy ký tự nào cần khôi phục.');
  }
}

// Chạy script
try {
  main();
} catch (error) {
  console.error('Lỗi khi chạy script:', error);
}
