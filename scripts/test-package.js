#!/usr/bin/env node

/**
 * EduConnect System - Package Test Script
 * This script tests the package configuration and exports
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing EduConnect System Package Configuration');
console.log('==================================================');

// Test 1: Check package.json
console.log('\n📋 Test 1: Checking package.json...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  console.log('✅ Package name:', packageJson.name);
  console.log('✅ Version:', packageJson.version);
  console.log('✅ Main entry:', packageJson.main);
  console.log('✅ Types:', packageJson.types);
  console.log('✅ Registry:', packageJson.publishConfig?.registry);
  
  // Check required fields
  const requiredFields = ['name', 'version', 'description', 'author', 'license', 'repository'];
  const missingFields = requiredFields.filter(field => !packageJson[field]);
  
  if (missingFields.length > 0) {
    console.log('⚠️  Missing fields:', missingFields.join(', '));
  } else {
    console.log('✅ All required fields present');
  }
  
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Test 2: Check .npmrc
console.log('\n📋 Test 2: Checking .npmrc configuration...');
try {
  if (fs.existsSync('.npmrc')) {
    const npmrc = fs.readFileSync('.npmrc', 'utf8');
    
    if (npmrc.includes('@kotkala:registry=https://npm.pkg.github.com')) {
      console.log('✅ GitHub Packages registry configured');
    } else {
      console.log('⚠️  GitHub Packages registry not configured');
    }
    
    if (npmrc.includes('//npm.pkg.github.com/:_authToken')) {
      console.log('✅ Authentication token placeholder configured');
    } else {
      console.log('⚠️  Authentication token not configured');
    }
  } else {
    console.log('❌ .npmrc file not found');
  }
} catch (error) {
  console.log('❌ Error reading .npmrc:', error.message);
}

// Test 3: Check bunfig.toml
console.log('\n📋 Test 3: Checking bunfig.toml...');
try {
  if (fs.existsSync('bunfig.toml')) {
    console.log('✅ bunfig.toml exists');
    const bunfig = fs.readFileSync('bunfig.toml', 'utf8');
    
    if (bunfig.includes('@kotkala')) {
      console.log('✅ Bun scoped registry configured');
    } else {
      console.log('⚠️  Bun scoped registry not configured');
    }
  } else {
    console.log('⚠️  bunfig.toml not found (optional)');
  }
} catch (error) {
  console.log('❌ Error reading bunfig.toml:', error.message);
}

// Test 4: Check main entry file
console.log('\n📋 Test 4: Checking main entry file...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const mainFile = packageJson.main;
  
  if (fs.existsSync(mainFile)) {
    console.log('✅ Main entry file exists:', mainFile);
    
    // Check if it's a valid TypeScript/JavaScript file
    const content = fs.readFileSync(mainFile, 'utf8');
    if (content.includes('export')) {
      console.log('✅ Main file contains exports');
    } else {
      console.log('⚠️  Main file might not have proper exports');
    }
  } else {
    console.log('❌ Main entry file not found:', mainFile);
  }
} catch (error) {
  console.log('❌ Error checking main entry file:', error.message);
}

// Test 5: Check GitHub Actions workflow
console.log('\n📋 Test 5: Checking GitHub Actions workflow...');
try {
  const workflowPath = '.github/workflows/publish-package.yml';
  if (fs.existsSync(workflowPath)) {
    console.log('✅ GitHub Actions workflow exists');
    
    const workflow = fs.readFileSync(workflowPath, 'utf8');
    if (workflow.includes('bun publish')) {
      console.log('✅ Workflow includes Bun publish step');
    } else {
      console.log('⚠️  Workflow might not include proper publish step');
    }
  } else {
    console.log('⚠️  GitHub Actions workflow not found');
  }
} catch (error) {
  console.log('❌ Error checking GitHub Actions workflow:', error.message);
}

// Test 6: Check environment variables
console.log('\n📋 Test 6: Checking environment variables...');
if (process.env.GITHUB_TOKEN) {
  console.log('✅ GITHUB_TOKEN environment variable is set');
} else {
  console.log('⚠️  GITHUB_TOKEN environment variable not set');
  console.log('   Set it with: export GITHUB_TOKEN=your_token_here');
}

// Test 7: Check file structure
console.log('\n📋 Test 7: Checking file structure...');
const expectedFiles = [
  'package.json',
  '.npmrc',
  'bunfig.toml',
  'src/index.ts',
  'scripts/setup-github-packages.sh',
  'scripts/setup-github-packages.bat',
  'docs/GITHUB_PACKAGES_SETUP.md',
  'PACKAGE.md'
];

expectedFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} (missing)`);
  }
});

// Summary
console.log('\n📊 Summary');
console.log('==========');
console.log('Package configuration test completed!');
console.log('\n🚀 Next steps:');
console.log('1. Set GITHUB_TOKEN environment variable');
console.log('2. Run: bun install');
console.log('3. Run: bun run lint');
console.log('4. Run: bun run build');
console.log('5. Run: scripts/setup-github-packages.bat (Windows) or scripts/setup-github-packages.sh (Unix)');
console.log('\n📚 For detailed instructions, see: docs/GITHUB_PACKAGES_SETUP.md');
