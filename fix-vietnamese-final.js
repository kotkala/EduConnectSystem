#!/usr/bin/env node
/**
 * Final Vietnamese encoding fix script
 * Based on actual corrupted patterns found in the project
 */

const fs = require('fs');
const path = require('path');

function fixVietnameseEncoding(text) {
  let fixed = text;
  
  // ONLY the actual corrupted patterns found in the scan
  const fixes = [
    // Basic single character fixes
    [/Ã¡/g, 'á'], [/Ã\u00A0/g, 'à'], [/Ã /g, 'à'], [/Ã£/g, 'ã'], [/Ã¢/g, 'â'], [/Äƒ/g, 'ă'],
    [/Ã©/g, 'é'], [/Ã¨/g, 'è'], [/Ãª/g, 'ê'], [/Ã­/g, 'í'], [/Ã¬/g, 'ì'],
    [/Ã³/g, 'ó'], [/Ã²/g, 'ò'], [/Ãµ/g, 'õ'], [/Ã´/g, 'ô'], [/Æ¡/g, 'ơ'],
    [/Ãº/g, 'ú'], [/Ã¹/g, 'ù'], [/Æ°/g, 'ư'], [/Ã½/g, 'ý'], [/Ä‘/g, 'đ'],
    
    // Capital letters
    [/Ãƒ/g, 'Ã'], [/Ã€/g, 'À'], [/Ã\u00A0/g, 'À'], [/Ã‚/g, 'Â'], [/Ä‚/g, 'Ă'], [/Ã‰/g, 'É'], [/Ãˆ/g, 'È'],
    [/ÃŠ/g, 'Ê'], [/Ã/g, 'Í'], [/ÃŒ/g, 'Ì'], [/Ã"/g, 'Ó'], [/Ã'/g, 'Ò'],
    [/Ã•/g, 'Õ'], [/Ã”/g, 'Ô'], [/Æ /g, 'Ơ'], [/Ãš/g, 'Ú'], [/Ã™/g, 'Ù'],
    [/Æ¯/g, 'Ư'], [/Ã/g, 'Ý'], [/Ä/g, 'Đ'],
    
    // Complex diacritics - based on actual patterns found
    [/áº£/g, 'ả'], [/áº¡/g, 'ạ'], [/áº¥/g, 'ấ'], [/áº§/g, 'ầ'], [/áº©/g, 'ẩ'],
    [/áº«/g, 'ẫ'], [/áº­/g, 'ậ'], [/áº¯/g, 'ắ'], [/áº±/g, 'ằ'], [/áº³/g, 'ẳ'],
    [/áºµ/g, 'ẵ'], [/áº·/g, 'ặ'], [/áº»/g, 'ẻ'], [/áº½/g, 'ẽ'], [/áº¹/g, 'ẹ'],
    [/áº¿/g, 'ế'], [/á»/g, 'ề'], [/á»ƒ/g, 'ể'], [/á»…/g, 'ễ'], [/á»‡/g, 'ệ'],
    [/á»‰/g, 'ỉ'], [/Ä©/g, 'ĩ'], [/á»‹/g, 'ị'], [/á»/g, 'ỏ'], [/á»/g, 'ọ'],
    [/á»'/g, 'ố'], [/á»‘/g, 'ố'], [/á»“/g, 'ồ'], [/á»•/g, 'ổ'], [/á»—/g, 'ỗ'], [/á»™/g, 'ộ'],
    [/á»›/g, 'ớ'], [/á»/g, 'ờ'], [/á»Ÿ/g, 'ở'], [/á»¡/g, 'ỡ'], [/á»£/g, 'ợ'],
    [/á»§/g, 'ủ'], [/Å©/g, 'ũ'], [/á»¥/g, 'ụ'], [/á»©/g, 'ứ'], [/á»«/g, 'ừ'],
    [/á»­/g, 'ử'], [/á»¯/g, 'ữ'], [/á»±/g, 'ự'], [/á»³/g, 'ỳ'], [/á»·/g, 'ỷ'],
    [/á»¹/g, 'ỹ'], [/á»µ/g, 'ỵ'],
    
    // Capital complex diacritics
    [/Ã/g, 'Á'],[/áº¢/g, 'Ả'], [/áº\u00A0/g, 'Ạ'], [/áº¤/g, 'Ấ'], [/áº¦/g, 'Ầ'], [/áº¨/g, 'Ẩ'],
    [/áºª/g, 'Ẫ'], [/áº¬/g, 'Ậ'], [/áº®/g, 'Ắ'], [/áº°/g, 'Ằ'], [/áº²/g, 'Ẳ'],
    [/áº´/g, 'Ẵ'], [/áº¶/g, 'Ặ'], [/áºº/g, 'Ẻ'], [/áº¼/g, 'Ẽ'], [/áº¸/g, 'Ẹ'],
    [/áº¾/g, 'Ế'], [/á»€/g, 'Ề'], [/á»‚/g, 'Ể'], [/á»„/g, 'Ễ'], [/á»†/g, 'Ệ'],
    [/á»ˆ/g, 'Ỉ'], [/Ä¨/g, 'Ĩ'], [/á»Š/g, 'Ị'], [/á»Ž/g, 'Ỏ'], [/á»Œ/g, 'Ọ'],
    [/á»/g, 'Ố'], [/á»’/g, 'Ồ'], [/á»"/g, 'Ổ'], [/á»–/g, 'Ỗ'], [/á»˜/g, 'Ộ'],
    [/á»š/g, 'Ớ'], [/á»œ/g, 'Ờ'], [/á»ž/g, 'Ở'], [/á» /g, 'Ỡ'], [/á»¢/g, 'Ợ'],
    [/á»¦/g, 'Ủ'], [/Å¨/g, 'Ũ'], [/á»¤/g, 'Ụ'], [/á»¨/g, 'Ứ'], [/á»ª/g, 'Ừ'],
    [/á»¬/g, 'Ử'], [/á»®/g, 'Ữ'], [/á»°/g, 'Ự'], [/á»²/g, 'Ỳ'], [/á»¶/g, 'Ỷ'],
    [/á»¸/g, 'Ỹ'], [/á»´/g, 'Ỵ']
  ];
  
  // Sort fixes by pattern length (longest first) to avoid conflicts
  const sortedFixes = fixes.sort((a, b) => {
    const patternA = a[0].source; // Get regex source
    const patternB = b[0].source;
    return patternB.length - patternA.length; // Longest first
  });

  // Apply all fixes in order
  for (const [pattern, replacement] of sortedFixes) {
    fixed = fixed.replace(pattern, replacement);
  }
  
  return fixed;
}

function shouldProcessFile(filePath) {
  const validExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.md'];
  const ext = path.extname(filePath).toLowerCase();

  if (!validExtensions.includes(ext)) {
    return false;
  }

  // Skip this script file itself
  const fileName = path.basename(filePath);
  if (fileName === 'fix-vietnamese-final.js') {
    return false;
  }

  const skipDirs = ['node_modules', '.git', '.next', 'dist', 'build', '.vscode'];

  for (const skipDir of skipDirs) {
    if (filePath.includes(skipDir)) {
      return false;
    }
  }

  return true;
}

function fixFileEncoding(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fixedContent = fixVietnameseEncoding(content);
    
    if (fixedContent !== content) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      return { success: true, message: 'Fixed Vietnamese encoding' };
    } else {
      return { success: false, message: 'No changes needed' };
    }
    
  } catch (error) {
    return { success: false, message: `Error: ${error.message}` };
  }
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

function main() {
  console.log('🔧 FINAL Vietnamese encoding fix...');
  console.log(`📁 Processing files in: ${process.cwd()}`);
  console.log('✨ Using ONLY actual corrupted patterns found in scan');
  console.log();
  
  let totalFiles = 0;
  let fixedFiles = 0;
  let errorFiles = 0;
  
  try {
    const allFiles = getAllFiles('.');
    
    for (const filePath of allFiles) {
      if (shouldProcessFile(filePath)) {
        totalFiles++;
        
        if (totalFiles % 50 === 0) {
          console.log(`📊 Processed ${totalFiles} files so far...`);
        }
        
        const result = fixFileEncoding(filePath);
        
        if (result.success) {
          fixedFiles++;
          console.log(`✅ Fixed: ${filePath}`);
        } else if (result.message.startsWith('Error:')) {
          errorFiles++;
          console.log(`❌ Error in ${filePath}: ${result.message}`);
        }
      }
    }
    
    console.log();
    console.log('='.repeat(60));
    console.log('📋 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Total files processed: ${totalFiles}`);
    console.log(`✅ Files fixed: ${fixedFiles}`);
    console.log(`❌ Files with errors: ${errorFiles}`);
    console.log(`✨ Files unchanged: ${totalFiles - fixedFiles - errorFiles}`);
    console.log();
    
    if (fixedFiles > 0) {
      console.log('🎉 Vietnamese encoding issues have been PROPERLY fixed!');
      console.log('💡 Please review the changes and test your application.');
    } else {
      console.log('✅ No Vietnamese encoding issues found.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
