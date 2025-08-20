const fs = require('fs');
const path = require('path');

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

// Hàm để tìm các ký tự có thể bị encode
function findEncodedCharacters(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const encodedLines = [];
    
    lines.forEach((line, index) => {
      // Tìm các pattern có thể bị encode
      // Các ký tự đặc biệt thường xuất hiện trong encoding issues
      if (line.match(/[ÃÄáºáº»á»]/)) {
        encodedLines.push({
          lineNumber: index + 1,
          content: line.trim()
        });
      }
    });
    
    return encodedLines;
  } catch (error) {
    console.error(`Lỗi khi đọc file ${filePath}:`, error.message);
    return [];
  }
}

// Hàm chính
function main() {
  console.log('🔍 Kiểm tra cuối cùng các ký tự tiếng Việt bị encode...\n');
  
  const srcDir = path.join(__dirname, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Không tìm thấy thư mục src/');
    return;
  }
  
  const files = findFiles(srcDir);
  console.log(`📁 Đang kiểm tra ${files.length} file...\n`);
  
  let totalEncodedLines = 0;
  let filesWithEncoding = 0;
  const encodingIssues = [];
  
  files.forEach(filePath => {
    const encodedLines = findEncodedCharacters(filePath);
    if (encodedLines.length > 0) {
      const relativePath = path.relative(__dirname, filePath);
      filesWithEncoding++;
      totalEncodedLines += encodedLines.length;
      
      encodingIssues.push({
        file: relativePath,
        lines: encodedLines
      });
    }
  });
  
  console.log('📊 Kết quả kiểm tra:');
  console.log(`   - Tổng số file có vấn đề encoding: ${filesWithEncoding}`);
  console.log(`   - Tổng số dòng có ký tự bị encode: ${totalEncodedLines}\n`);
  
  if (filesWithEncoding > 0) {
    console.log('⚠️  Các file còn ký tự bị encode:');
    encodingIssues.forEach(issue => {
      console.log(`\n📄 ${issue.file}:`);
      issue.lines.forEach(line => {
        console.log(`   Dòng ${line.lineNumber}: ${line.content}`);
      });
    });
    
    console.log('\n💡 Gợi ý: Cần cập nhật mapping để sửa các ký tự này.');
  } else {
    console.log('✅ Tuyệt vời! Không còn ký tự nào bị encode.');
  }
}

// Chạy script
try {
  main();
} catch (error) {
  console.error('Lỗi khi chạy script:', error);
}
