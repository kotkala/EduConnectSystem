# GitHub Packages Setup Guide for EduConnect System

This guide will help you set up GitHub Packages for the EduConnect System using Bun.

## 📋 Prerequisites

- [Bun](https://bun.sh/) installed on your system
- GitHub account with repository access
- GitHub Personal Access Token with package permissions

## 🔑 Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a descriptive name: `EduConnect Package Access`
4. Select the following scopes:
   - ✅ `read:packages` - Download packages from GitHub Package Registry
   - ✅ `write:packages` - Upload packages to GitHub Package Registry
   - ✅ `repo` - Full control of private repositories (if your repo is private)
5. Click "Generate token"
6. **Important**: Copy the token immediately (you won't see it again!)

## 🔧 Step 2: Configure Environment

### Option A: Set Environment Variable (Recommended)

**Windows (PowerShell):**
```powershell
$env:GITHUB_TOKEN="your_token_here"
# To make it permanent:
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "your_token_here", "User")
```

**Windows (Command Prompt):**
```cmd
set GITHUB_TOKEN=your_token_here
# To make it permanent:
setx GITHUB_TOKEN "your_token_here"
```

**macOS/Linux:**
```bash
export GITHUB_TOKEN="your_token_here"
# To make it permanent, add to ~/.bashrc or ~/.zshrc:
echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.bashrc
```

### Option B: Update .npmrc File

The `.npmrc` file has been created for you, but you can manually update it:

```ini
@kotkala:registry=https://npm.pkg.github.com
registry=https://registry.npmjs.org/
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN_HERE
always-auth=true
```

## 🚀 Step 3: Automated Setup

### Windows Users:
```cmd
scripts\setup-github-packages.bat
```

### macOS/Linux Users:
```bash
chmod +x scripts/setup-github-packages.sh
./scripts/setup-github-packages.sh
```

### Manual Setup:

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Run linting:**
   ```bash
   bun run lint
   ```

3. **Build the project:**
   ```bash
   bun run build
   ```

4. **Publish the package:**
   ```bash
   # Patch version (0.1.0 → 0.1.1)
   bun run package:publish
   
   # Or manually:
   bun version patch
   bun publish
   ```

## 📦 Step 4: Publishing Options

### Version Bumping

```bash
# Patch version (0.1.0 → 0.1.1) - for bug fixes
bun version patch

# Minor version (0.1.0 → 0.2.0) - for new features
bun version minor

# Major version (0.1.0 → 1.0.0) - for breaking changes
bun version major

# Custom version
bun version 1.2.3
```

### Publishing Commands

```bash
# Dry run (test without publishing)
bun publish --dry-run

# Publish to GitHub Packages
bun publish

# Publish with custom tag
bun publish --tag beta
```

## 🔄 Step 5: Automated Publishing with GitHub Actions

The repository includes a GitHub Actions workflow that automatically publishes packages:

### Trigger Options:

1. **On Release Creation:**
   - Create a new release on GitHub
   - The package will be automatically published

2. **Manual Trigger:**
   - Go to Actions tab in your GitHub repository
   - Select "Publish to GitHub Packages" workflow
   - Click "Run workflow"
   - Choose version bump type (patch/minor/major)

## 📥 Step 6: Installing the Package

### For Other Projects:

1. **Configure npm/bun to use GitHub Packages:**
   ```bash
   echo "@kotkala:registry=https://npm.pkg.github.com" >> .npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> .npmrc
   ```

2. **Install the package:**
   ```bash
   # Using Bun
   bun add @kotkala/educonnect-system
   
   # Using npm
   npm install @kotkala/educonnect-system
   
   # Using yarn
   yarn add @kotkala/educonnect-system
   ```

## 🔍 Step 7: Verify Package

### Check Package Information:
```bash
# View package info
bun info @kotkala/educonnect-system

# List all versions
bun view @kotkala/educonnect-system versions --json
```

### View on GitHub:
- Go to your repository
- Click on "Packages" tab
- You should see `@kotkala/educonnect-system` listed

## 🛠️ Troubleshooting

### Common Issues:

1. **Authentication Error:**
   ```
   npm ERR! 401 Unauthorized
   ```
   **Solution:** Check your GitHub token and .npmrc configuration

2. **Package Not Found:**
   ```
   npm ERR! 404 Not Found
   ```
   **Solution:** Ensure the package name matches exactly: `@kotkala/educonnect-system`

3. **Permission Denied:**
   ```
   npm ERR! 403 Forbidden
   ```
   **Solution:** Verify your GitHub token has `write:packages` permission

4. **Registry Issues:**
   ```
   npm ERR! Registry returned 404
   ```
   **Solution:** Check your .npmrc configuration and registry URLs

### Debug Commands:

```bash
# Check npm configuration
bun config list

# Check registry configuration
bun config get registry

# Verify authentication
bun whoami --registry https://npm.pkg.github.com
```

## 📚 Additional Resources

- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Bun Package Manager](https://bun.sh/docs/cli/install)
- [npm Registry Configuration](https://docs.npmjs.com/cli/v7/using-npm/config)

## 🆘 Support

If you encounter issues:

1. Check the [GitHub Issues](https://github.com/kotkala/EduConnectSystem/issues)
2. Review the [troubleshooting section](#troubleshooting)
3. Create a new issue with detailed error messages

---

**Next Steps:** Once your package is published, you can share it with your team or use it in other projects by following the installation instructions above.
